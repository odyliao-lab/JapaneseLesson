import { createLocalAccount, authenticateLocalAccount, isLocalDeployment, LOCAL_SESSION_COOKIE } from "../../local-auth";
import { APP_BASE_PATH } from "../../base-path";

export async function POST(request: Request) {
  if (!isLocalDeployment()) return Response.json({ error: "此登入方式只在本機站啟用。" }, { status: 404 });
  const payload = await request.json() as { action?: string; email?: string; displayName?: string; password?: string; returnTo?: string };
  try {
    const session = payload.action === "register"
      ? await createLocalAccount(payload.email ?? "", payload.displayName ?? "", payload.password ?? "")
      : await authenticateLocalAccount(payload.email ?? "", payload.password ?? "");
    const returnTo = safeReturnTo(payload.returnTo ?? "/");
    return Response.json({ ok: true, returnTo }, {
      headers: { "set-cookie": `${LOCAL_SESSION_COOKIE}=${session.token}; Path=${APP_BASE_PATH || "/"}; HttpOnly; Secure; SameSite=Lax; Expires=${new Date(session.expiresAt).toUTCString()}` },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "登入失敗。" }, { status: 400 });
  }
}

function safeReturnTo(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
