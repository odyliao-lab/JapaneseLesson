import { register } from "node:module";

register(new URL("./hooks/test-loader.mjs", import.meta.url));
