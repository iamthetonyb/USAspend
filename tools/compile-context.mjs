#!/usr/bin/env node
/**
 * compile-context.mjs
 * Aggregates all project docs into docs/PROJECT_CONTEXT.md — a single
 * AI-loadable snapshot of data source status, pending TODOs, and pipeline state.
 *
 * Run: node tools/compile-context.mjs
 *      pnpm context:compile
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const DOCS = join(ROOT, "docs");
const INGEST = join(ROOT, "tools/ingest");
const OUT = join(DOCS, "PROJECT_CONTEXT.md");

// ── helpers ──────────────────────────────────────────────────────────────────

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function glob(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => join(dir, f))
    .sort();
}

/** Extract TODO lines from a file, with file label */
function extractTodos(filePath) {
  const src = read(filePath);
  const name = basename(filePath);
  return src
    .split("\n")
    .filter((l) => /TODO|FIXME|PENDING|configure|verify.*report.*id/i.test(l) && l.trim().length > 4)
    .slice(0, 6)
    .map((l) => `  [${name}] ${l.trim()}`);
}

/** Parse status table rows from nevada-data-runbook.md */
function parseStatusTable(src) {
  const rows = [];
  let inTable = false;
  for (const line of src.split("\n")) {
    if (line.startsWith("| Layer")) { inTable = true; continue; }
    if (inTable && line.startsWith("|---")) continue;
    if (inTable && line.startsWith("|")) {
      const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 3) rows.push({ layer: cols[0], source: cols[1], status: cols[2] });
    } else if (inTable && !line.startsWith("|")) {
      inTable = false;
    }
  }
  return rows;
}

function statusEmoji(s) {
  if (s.includes("✅")) return "✅";
  if (s.includes("🟡")) return "🟡";
  return "🔴";
}

// ── gather ────────────────────────────────────────────────────────────────────

const runbookSrc = read(join(DOCS, "nevada-data-runbook.md"));
const statusRows = parseStatusTable(runbookSrc);

const live = statusRows.filter((r) => r.status.includes("✅"));
const verify = statusRows.filter((r) => r.status.includes("🟡"));
const pending = statusRows.filter((r) => r.status.includes("🔴"));

const ingestFiles = glob(INGEST, ".mjs").filter((f) => !basename(f).startsWith("common"));
const allTodos = ingestFiles.flatMap(extractTodos);

const dataSourceDocs = glob(join(DOCS, "data-sources"), ".md");

// bootstrap.json freshness
let generatedAt = "unknown";
const bsPath = join(ROOT, "frontend/data/bootstrap.json");
if (existsSync(bsPath)) {
  try {
    const bs = JSON.parse(readFileSync(bsPath, "utf8"));
    generatedAt = bs?.sourceMeta?.generatedAt ?? "unknown";
  } catch {}
}

// ── render ────────────────────────────────────────────────────────────────────

const now = new Date().toISOString();

const out = `# USA Spending Watch — Project Context
> Auto-generated ${now} by \`pnpm context:compile\`
> Load this file for full project state in any AI session.

## Stack
- Frontend: plain HTML/CSS/JS → Cloudflare Pages
- Data plane: Rust validator (\`crates/spending-validate/\`)
- Ingestion: Node.js ESM scripts (\`tools/ingest/*.mjs\`)
- Automation: GitHub Actions daily light / weekly full / monthly discovery cron (\`.github/workflows/ingest-nevada.yml\`)
- Bootstrap data: \`frontend/data/bootstrap.json\` (last generated: ${generatedAt})

## Data Source Status (${statusRows.length} total)

### Live (${live.length})
${live.map((r) => `- ✅ **${r.layer}** — ${r.source}`).join("\n") || "- none"}

### Needs Verification (${verify.length})
${verify.map((r) => `- 🟡 **${r.layer}** — ${r.source}`).join("\n") || "- none"}

### Pending (${pending.length})
${pending.map((r) => `- 🔴 **${r.layer}** — ${r.source.replace(/—.*$/, "").trim()}`).join("\n") || "- none"}

## Ingestion Script TODOs
${allTodos.length > 0 ? allTodos.join("\n") : "- none found"}

## Key Scripts
\`\`\`bash
pnpm generate:nevada      # regenerate bootstrap.json from APIs
pnpm validate:data        # Rust hard gate
pnpm check:freshness      # data-age and live-source guard
pnpm discover:sources     # probe pending source portals
pnpm check                # full lint + Rust + freshness + manifest + backend audit
pnpm context:compile      # regenerate this file
pnpm deploy:pages         # deploy to Cloudflare Pages
\`\`\`

## Activating Pending Connectors (priority order)
1. Nevada state checkbook — set \`OPEN_BOOKS_REPORT_ID\` in \`tools/ingest/nevada-state-checkbook.mjs\`
2. Las Vegas city — set \`LAS_VEGAS_REPORT_ID\` in \`tools/ingest/nevada-las-vegas.mjs\`
3. Clark County Socrata — verify dataset ID at data.clarkcountynv.gov, set in \`tools/ingest/nevada-counties.mjs\`
4. CCSD Open Book — verify OpenGov subdomain, set \`CCSD_BUDGET_REPORT_ID\` in \`tools/ingest/nevada-ccsd.mjs\`
5. RTC Southern Nevada — verify Socrata at data.rtcsnv.com

**How to find OpenGov report IDs:**
1. Open the portal URL in browser
2. DevTools → Network → filter XHR
3. Interact with the report (click filters, change dates)
4. Find API call like \`/api/v1/report/{reportId}/data\`
5. Copy the report ID into the ingest script

## Data-Source Runbooks
${dataSourceDocs.map((f) => `- \`${f.replace(ROOT + "/", "")}\``).join("\n")}

## Accuracy Rules (non-negotiable)
- "Review amount" = official source amount for priority review, NOT an allegation
- Never call a row waste/fraud/corruption unless an official enforcement source confirms it
- County + district totals can overlap federal award samples — do not sum them
- Nevada OpenBudget exclusions must be displayed in UI before claiming full state spend coverage
- Label Transparent Nevada as "independent source" — not an official state portal

## Next Steps
1. Configure real OpenGov/Socrata IDs (see Activating Pending Connectors above)
2. Run \`node tools/ingest/{source}.mjs\` per connector
3. \`pnpm generate:nevada && pnpm validate:data\`
4. \`pnpm check\` — must pass before commit
5. Commit + push → Cloudflare Pages auto-deploys via GitHub integration

## Files to Know
- \`frontend/assets/js/app.js\` — dashboard UI logic
- \`frontend/assets/js/map.js\` — MapLibre wrapper
- \`frontend/assets/css/styles.css\` — all styles
- \`frontend/data/bootstrap.json\` — compiled demo data (committed)
- \`tools/generate-nevada-demo.mjs\` — main data assembly script
- \`tools/ingest/common.mjs\` — shared fetch/Socrata/OpenGov utilities
- \`crates/spending-validate/\` — Rust validation gate
- \`.github/workflows/ingest-nevada.yml\` — scheduled ingestion + source discovery

---
*Regenerate anytime: \`pnpm context:compile\`*
`;

writeFileSync(OUT, out, "utf8");
console.log(`✅ Context compiled → docs/PROJECT_CONTEXT.md`);
console.log(`   ${live.length} live  |  ${verify.length} verify  |  ${pending.length} pending  |  ${allTodos.length} TODOs`);
