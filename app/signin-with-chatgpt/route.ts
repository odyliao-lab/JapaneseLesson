import { isLocalDeployment } from "../local-auth";
import { appPath } from "../base-path";

export async function GET(request: Request) {
  if (!isLocalDeployment()) return new Response("Not found", { status: 404 });
  const returnTo = new URL(request.url).searchParams.get("return_to") ?? "/";
  return Response.redirect(new URL(appPath(`/account?return_to=${encodeURIComponent(returnTo)}`), request.url), 302);
}
