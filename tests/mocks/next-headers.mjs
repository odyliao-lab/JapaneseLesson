import { headerStore } from "./state.mjs";

export async function headers() {
  return {
    get(name) {
      return headerStore.get(String(name).toLowerCase()) ?? null;
    },
  };
}

export function cookies() {
  throw new Error("cookies() is not stubbed in unit tests");
}

export function draftMode() {
  throw new Error("draftMode() is not stubbed in unit tests");
}
