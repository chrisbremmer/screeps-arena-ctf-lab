// Rewrite ./main.mjs to re-export the named variant.
//
// Usage: node runner/swap-variant.mjs v1-river-control
//        npm run variant -- v1-river-control

import { readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error("Usage: node runner/swap-variant.mjs <variant-name>");
    process.exit(1);
  }

  const variantPath = join(ROOT, "variants", `${name}.mjs`);
  if (!(await exists(variantPath))) {
    console.error(`Variant not found: variants/${name}.mjs`);
    process.exit(1);
  }

  const mainPath = join(ROOT, "main.mjs");
  const current = await readFile(mainPath, "utf8");
  const next = `// Active variant entry point — what the Arena client loads.
//
// The Steam Arena client is configured to watch the repo root and looks for
// main.mjs here. runner/swap-variant.mjs rewrites this file to re-export a
// different variant. Do not import strategy directly here; let the variant
// module own that decision.

export { loop } from "./variants/${name}.mjs";
`;
  if (current === next) {
    console.log(`already on ${name}`);
    return;
  }
  await writeFile(mainPath, next, "utf8");
  console.log(`swapped → variants/${name}.mjs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
