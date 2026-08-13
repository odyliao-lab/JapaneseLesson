import { revokeLocalSession, isLocalDeployment, LOCAL_SESSION_COOKIE } from "../local-auth";
import { APP_BASE_PATH, appPath } from "../base-path";

export async function GET(request: Request) {
  if (!isLocalDeployment()) return new Response("Not found", { status: 404 });
  const cookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${LOCAL_SESSION_COOKIE}=`))?.split("=")[1];
  await revokeLocalSession(cookie);
  const returnTo = safeReturnTo(new URL(request.url).searchParams.get("return_to") ?? "/");
  return new Response(null, {
    status: 302,
    headers: {
      location: new URL(appPath(returnTo), request.url).toString(),
      "set-cookie": `${LOCAL_SESSION_COOKIE}=; Path=${APP_BASE_PATH || "/"}; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
}

function safeReturnTo(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
