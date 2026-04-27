// `npm run push` is currently a no-op.
//
// The Arena Steam client is configured to watch the repo root directly, so the
// dev loop is "edit → save → client reloads" — no copy step is needed.
//
// This script is kept as a placeholder for the future case where we add a real
// build step (transpile, minify, dead-code elimination) and need to ship a
// pre-built tree to a separate watched folder. When that happens, fill in:
//
//   1. Compile / bundle src/ + variants/ into dist/.
//   2. Copy dist/ + typings/ to runner/config.mjs's `clientBotFolder`.
//   3. Update the Arena client's bot path to that folder.
//
// Until then, just save your edits and the client picks them up.

console.log("push: no-op — Arena client watches the repo root directly. Edits are picked up on save.");
console.log("If you need to retarget to a separate folder, see runner/push.mjs comments.");
