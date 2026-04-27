// Replay parser. The Steam Arena client caches replays as zips under
// %AppData%/../LocalLow/ScreepsCommunity (Windows) or
// ~/Library/Application Support/com.unity3d.ScreepsCommunity/ScreepsArena (macOS,
// approximate — to verify in-client).
//
// Phase 0 stub: contract only. The body is filled in once we've inspected an
// actual zip and confirmed the format. Don't reverse-engineer blind — log what
// we see, then write the parser.

export async function parseReplay(/* zipPath */) {
  throw new Error("parseReplay: not implemented yet — Phase 1");
}

// Once implemented, returns:
// {
//   matchId: string,
//   ticks: number,
//   outcome: "win" | "loss" | "draw",
//   logs: Array<{ tick: number, event: string, [key: string]: any }>,
// }
