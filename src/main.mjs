// Active variant entry point — what the Arena client loads.
//
// runner/swap-variant.mjs rewrites this file to re-export a different variant.
// Do not import strategy directly here; let the variant module own that decision.

export { loop } from "../variants/v0-baseline.mjs";
