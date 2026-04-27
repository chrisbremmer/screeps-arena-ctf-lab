// Build (no transpile yet — we ship .mjs as-is) and copy main.mjs + dependencies
// into the Arena client's watched bot folder.
//
// In Phase 0 we keep it simple: copy src/ + variants/ + typings/ as a tree so
// relative imports in main.mjs continue to resolve. The Arena client tolerates
// multi-file bots referenced from main.mjs via relative imports.

import { cp, mkdir, rm, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

async function loadConfig() {
  try {
    const mod = await import(join(ROOT, "runner", "config.mjs"));
    return mod.default;
  } catch {
    console.error("runner/config.mjs not found. Copy runner/config.example.mjs and edit it.");
    process.exit(1);
  }
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  const config = await loadConfig();
  if (!config.clientBotFolder) {
    console.error("config.clientBotFolder is empty. Set it in runner/config.mjs.");
    process.exit(1);
  }

  const dest = config.clientBotFolder;
  if (!(await exists(dest))) {
    console.error(`Destination does not exist: ${dest}`);
    process.exit(1);
  }

  // Mirror src/, variants/, and typings/ into dest. main.mjs lives at dest/main.mjs.
  for (const sub of ["src", "variants", "typings"]) {
    const target = join(dest, sub);
    await rm(target, { recursive: true, force: true });
    await mkdir(target, { recursive: true });
    await cp(join(ROOT, sub), target, { recursive: true });
  }
  await cp(join(ROOT, "src", "main.mjs"), join(dest, "main.mjs"));

  console.log(`pushed → ${dest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
