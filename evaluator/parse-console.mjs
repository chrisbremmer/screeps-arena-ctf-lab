// Parse a pasted Screeps Arena console blob into structured CTF events.
//
// The Arena client's replay viewer console contains lines prefixed with `[CTF]`
// followed by a JSON payload (see src/arena/log.mjs). The user copies the entire
// console (Cmd+A, Cmd+C) and feeds it here.
//
// Why a custom parser instead of split-on-newline + JSON.parse:
//   - Real-world pastes have line numbers / tabs prefixed by the console UI.
//   - Multiple events sometimes appear on a single visible line (the renderer
//     wraps long output without newlines).
//   - Truncated lines should be skipped without losing the surrounding events.
//
// Strategy: find every `[CTF]` substring, advance to the next `{`, then walk
// brace depth (with string-literal awareness) until the matching `}`. Parse
// the slice as JSON. Skip on parse failure.

const TAG = "[CTF]";

export function parseConsole(text) {
  const events = [];
  let i = 0;
  while (i < text.length) {
    const tagIdx = text.indexOf(TAG, i);
    if (tagIdx === -1) break;

    let j = tagIdx + TAG.length;
    while (j < text.length && text[j] !== "{") j++;
    if (j >= text.length) break;

    const start = j;
    let depth = 0;
    let inString = false;
    let escape = false;
    while (j < text.length) {
      const ch = text[j];
      if (escape) {
        escape = false;
      } else if (inString) {
        if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
      } else if (ch === '"') {
        inString = true;
      } else if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
      j++;
    }

    if (depth === 0) {
      const jsonStr = text.slice(start, j);
      try {
        events.push(JSON.parse(jsonStr));
      } catch {
        // Malformed (truncated paste, console artifact). Skip and continue.
      }
    }
    i = Math.max(j, tagIdx + TAG.length);
  }
  return events;
}
