export const APP_BASE_PATH = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "";

export function appPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (APP_BASE_PATH && (path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`))) return path;
  return `${APP_BASE_PATH}${path}`;
}
