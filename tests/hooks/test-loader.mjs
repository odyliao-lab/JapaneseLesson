/**
 * Resolve hook for unit tests: TypeScript extensionless imports, plus mocks for
 * ChatGPT Sites headers, next/navigation, cloudflare:workers, and getDb().
 */
import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const mockRoot = new URL("../mocks/", import.meta.url);

const specifierMocks = new Map([
  ["next/headers", new URL("next-headers.mjs", mockRoot).href],
  ["next/navigation", new URL("next-navigation.mjs", mockRoot).href],
  ["cloudflare:workers", new URL("cloudflare-workers.mjs", mockRoot).href],
]);

const tsExtensions = [".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.tsx"];
const appDbIndex = new URL("../../db/index.ts", import.meta.url).href;

function isAppDbModule(fileUrl) {
  return fileUrl === appDbIndex;
}

export async function resolve(specifier, context, nextResolve) {
  const mocked = specifierMocks.get(specifier);
  if (mocked) {
    return { url: mocked, shortCircuit: true };
  }

  if (specifier.startsWith(".") && !extname(specifier) && context.parentURL) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    for (const extra of tsExtensions) {
      const candidate = join(parentDir, specifier + extra);
      if (!existsSync(candidate)) continue;
      const url = pathToFileURL(candidate).href;
      if (isAppDbModule(url)) {
        return { url: new URL("db.mjs", mockRoot).href, shortCircuit: true };
      }
      return { url, shortCircuit: true };
    }
  }

  const resolved = await nextResolve(specifier, context);
  if (isAppDbModule(resolved.url)) {
    return { url: new URL("db.mjs", mockRoot).href, shortCircuit: true };
  }
  return resolved;
}
