import { readFileSync } from "node:fs";

// Data-URL test modules need an absolute URL for the Worker's shared dependency.
export function workerSource() {
  return readFileSync(
    new URL("../../worker.js", import.meta.url),
    "utf8",
  ).replace(
    "import './public/youtube.js';",
    `import '${new URL("../../public/youtube.js", import.meta.url).href}';`,
  );
}
