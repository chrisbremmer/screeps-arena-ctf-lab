// CLI: parse a pasted Arena console blob into a markdown match report.
// Reads stdin by default; optionally --file <path> or --journal to append.
//
// Usage:
//   pbpaste | npm run report
//   npm run report -- --file ./scratch/match7.txt
//   pbpaste | npm run report -- --journal --opponent "Drake" --variant v0-baseline

import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseConsole } from "./parse-console.mjs";
import { computeMetrics, splitMatches } from "./metrics.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

async function readStdin() {
  if (process.stdin.isTTY) {
    console.error(
      "report: no stdin and no --file flag.\nPipe a console paste in (e.g. `pbpaste | npm run report`) or pass --file <path>.",
    );
    process.exit(1);
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  const text = flags.file ? await readFile(flags.file, "utf8") : await readStdin();
  const events = parseConsole(text);
  if (events.length === 0) {
    console.error("report: no [CTF] events found in input. Did you copy the right console pane?");
    process.exit(2);
  }

  const matches = splitMatches(events);
  const variant = flags.variant ?? (await detectActiveVariant());
  const opponent = flags.opponent ?? "(unknown)";
  const note = flags.note ?? null;

  const reports = matches.map((matchEvents, i) => {
    const metrics = computeMetrics(matchEvents);
    const result = flags.result ?? toResultLetter(metrics.outcome);
    return renderMarkdown({
      metrics,
      variant,
      opponent,
      result,
      note,
      matchNumber: matches.length > 1 ? i + 1 : null,
    });
  });

  const md = reports.join("\n");
  console.log(md);

  if (matches.length > 1) {
    console.error(`report: parsed ${matches.length} matches from a multi-match paste.`);
  }

  if (flags.journal) {
    await appendJournal(md);
  }
}

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i++;
    }
  }
  return flags;
}

async function detectActiveVariant() {
  try {
    const main = await readFile(join(ROOT, "main.mjs"), "utf8");
    const m = main.match(/variants\/([a-z0-9-]+)\.mjs/i);
    return m ? m[1] : "(unknown)";
  } catch {
    return "(unknown)";
  }
}

function toResultLetter(outcome) {
  if (outcome === "loss" || outcome === "likely-loss") return "L";
  if (outcome === "likely-win") return "W";
  if (outcome === "likely-draw") return "D";
  return "?";
}

function renderMarkdown({ metrics, variant, opponent, result, note, matchNumber }) {
  const lines = [];
  const label = matchNumber ?? "?";
  lines.push(`## Match ${label} — ${variant} — ${result}`);
  lines.push("");
  lines.push(`**Opponent:** ${opponent}`);
  lines.push(`**Length:** ${metrics.finalTick} ticks`);
  lines.push(`**Outcome:** ${metrics.outcome} (${metrics.outcomeSource})`);
  if (note) lines.push(`**Note:** ${note}`);
  lines.push("");

  if (metrics.flagTimeline.length > 0) {
    lines.push("### Flag control timeline");
    lines.push("");
    lines.push("| tick | my | enemy | neutral |");
    lines.push("|---|---|---|---|");
    for (const f of metrics.flagTimeline) {
      lines.push(`| ${f.tick} | ${f.my} | ${f.enemy} | ${f.neutral} |`);
    }
    lines.push("");
  }

  if (metrics.captures.length > 0) {
    lines.push("### Captures");
    lines.push("");
    for (const c of metrics.captures) {
      const desc = c.type === "we-captured" ? `we captured a ${c.from} flag` : "we lost a flag";
      lines.push(`- tick ${c.tick}: ${desc}`);
    }
    lines.push("");
  }

  if (metrics.creepTimeline.length > 0) {
    lines.push("### Creep counts");
    lines.push("");
    lines.push("| tick | mine | enemy |");
    lines.push("|---|---|---|");
    for (const c of metrics.creepTimeline) {
      lines.push(`| ${c.tick} | ${c.mine} | ${c.enemy} |`);
    }
    lines.push("");
  }

  if (metrics.avgSpread !== null) {
    lines.push("### Cohesion");
    lines.push("");
    lines.push(`- Avg main-squad spread: ${metrics.avgSpread.toFixed(1)}`);
    lines.push(`- Peak main-squad spread: ${metrics.peakSpread}`);
    lines.push("");
  }

  if (metrics.init?.enemyComp) {
    lines.push("### Enemy composition (tick 1)");
    lines.push("");
    lines.push("```");
    lines.push(JSON.stringify(metrics.init.enemyComp));
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}

async function appendJournal(md) {
  const date = new Date().toISOString().slice(0, 10);
  const journalDir = join(ROOT, "journal");
  await mkdir(journalDir, { recursive: true });
  const path = join(journalDir, `${date}.md`);

  let header = "";
  try {
    await access(path);
  } catch {
    header = `# ${date}\n\n`;
  }

  const { appendFile } = await import("node:fs/promises");
  await appendFile(path, header + md + "\n", "utf8");
  console.error(`appended → journal/${date}.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
