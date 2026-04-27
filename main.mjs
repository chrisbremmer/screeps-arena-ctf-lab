// Active variant entry point — what the Arena client loads.
//
// The Steam Arena client is configured to watch the repo root and looks for
// main.mjs here. runner/swap-variant.mjs rewrites this file to re-export a
// different variant. Do not import strategy directly here; let the variant
// module own that decision.

export { loop } from "./variants/v5-rush-defense.mjs";
