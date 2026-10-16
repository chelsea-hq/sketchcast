import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Use the lockfile-selected package, including its existing Unicode subsets.
// No network, credential, or deployment access is needed for this copy.
const source = new URL("../node_modules/@excalidraw/excalidraw/dist/prod/fonts/", import.meta.url);
const target = process.argv[2] ?? fileURLToPath(new URL("../public/excalidraw/", import.meta.url));
await mkdir(target, { recursive: true });
await cp(source, path.join(target, "fonts"), { recursive: true });
