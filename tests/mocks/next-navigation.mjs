export function redirect(url) {
  const error = new Error(`NEXT_REDIRECT:${url}`);
  error.digest = `NEXT_REDIRECT;replace;${url};303;`;
  throw error;
}

export function notFound() {
  throw new Error("NEXT_NOT_FOUND");
}

export function usePathname() {
  return "/";
}

export function useRouter() {
  return { push() {}, replace() {}, back() {}, refresh() {}, prefetch() {} };
}
