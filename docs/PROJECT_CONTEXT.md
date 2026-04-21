# USA Spending Watch — Project Context
> Auto-generated 2026-04-21T08:11:17.988Z by `pnpm context:compile`
> Load this file for full project state in any AI session.

## Stack
- Frontend: plain HTML/CSS/JS → Cloudflare Pages
- Data plane: Rust validator (`crates/spending-validate/`)
- Ingestion: Node.js ESM scripts (`tools/ingest/*.mjs`)
- Automation: GitHub Actions weekly cron (`.github/workflows/ingest-nevada.yml`)
- Bootstrap data: `frontend/data/bootstrap.json` (last generated: 2026-04-21T00:36:39.326Z)

## Data Source Status (13 total)

### Live (3)
- ✅ **Federal awards by county** — USAspending.gov API
- ✅ **Federal awards by congressional district** — USAspending.gov API
- ✅ **County/district boundaries** — Census TIGERweb

### Needs Verification (2)
- 🟡 **RTC Southern Nevada** — Socrata (data.rtcsnv.com)
- 🟡 **WCSD school budget** — OpenGov or PDF

### Pending (8)
- 🔴 **State checkbook** — Nevada Open Books (OpenGov)
- 🔴 **State budget (w/ exclusions)** — Nevada OpenBudget
- 🔴 **Las Vegas city checkbook** — Las Vegas OpenGov
- 🔴 **CCSD school budget** — CCSD Open Book (OpenGov)
- 🔴 **Clark County** — Socrata (data.clarkcountynv.gov)
- 🔴 **Washoe County** — PDF ACFR
- 🔴 **Carson City** — PDF ACFR
- 🔴 **Water/utility districts** — PDF ACFRs

## Ingestion Script TODOs
  [nevada-ccsd.mjs] * TODO before first live run:
  [nevada-ccsd.mjs] const CCSD_BUDGET_REPORT_ID = "TODO_ccsd_report_id";
  [nevada-ccsd.mjs] if (CCSD_BUDGET_REPORT_ID === "TODO_ccsd_report_id") {
  [nevada-ccsd.mjs] console.warn("  SKIP: CCSD report ID not configured. Visit ccsd.net/departments/finance/ to find the Open Book link.");
  [nevada-ccsd.mjs] // TODO: implement once API shape is known
  [nevada-ccsd.mjs] sourceId: `https://www.ccsd.net/departments/finance/`, // TODO: link to specific program
  [nevada-counties.mjs] * TODO before first live run:
  [nevada-counties.mjs] const CLARK_EXPENDITURES_4X4 = "TODO_clark_dataset_id"; // e.g., "xk4d-3r9z"
  [nevada-counties.mjs] if (CLARK_EXPENDITURES_4X4 === "TODO_clark_dataset_id") {
  [nevada-counties.mjs] console.warn("  SKIP: Clark County Socrata dataset ID not configured.");
  [nevada-counties.mjs] // TODO: add Washoe, Carson City once their APIs are identified
  [nevada-counties.mjs] // TODO: merge into bootstrap.json
  [nevada-districts.mjs] *   Note: these are governance boundaries, not spending entities.
  [nevada-districts.mjs] *         Spending for legislature/courts is in the state checkbook.
  [nevada-districts.mjs] * TODO before first live run:
  [nevada-districts.mjs] const RTC_SNV_BUDGET_4X4 = "TODO_rtc_snv_dataset_id";
  [nevada-districts.mjs] if (RTC_SNV_BUDGET_4X4 === "TODO_rtc_snv_dataset_id") {
  [nevada-districts.mjs] console.warn("  SKIP: RTC SNV dataset ID not configured.");
  [nevada-las-vegas.mjs] * TODO before first live run:
  [nevada-las-vegas.mjs] // TODO: get real report IDs by inspecting network tab on the portal
  [nevada-las-vegas.mjs] const LV_CHECKBOOK_REPORT_ID = "TODO_lv_checkbook_report_id";
  [nevada-las-vegas.mjs] const LV_BUDGET_REPORT_ID = "TODO_lv_budget_report_id";
  [nevada-las-vegas.mjs] if (LV_CHECKBOOK_REPORT_ID === "TODO_lv_checkbook_report_id") {
  [nevada-las-vegas.mjs] console.warn("  SKIP: Las Vegas OpenGov report ID not configured.");
  [nevada-state-checkbook.mjs] * API: nevada-prod.spending.socrata.com (public, no key required)
  [nevada-state-checkbook.mjs] *   GET /api/historic_spending.json → monthly spend by year (all years)
  [nevada-state-checkbook.mjs] const BASE = "https://nevada-prod.spending.socrata.com";
  [nevada-state-checkbook.mjs] const historic = await fetchJson(`${BASE}/api/historic_spending.json`);
  [nevada-state-checkbook.mjs] source: "nevada-prod.spending.socrata.com",
  [nevada-state-checkbook.mjs] sourceUrl: `https://nevada-prod.spending.socrata.com/#!/year/${API_YEAR}/explore/0/level_1`,

## Key Scripts
```bash
pnpm generate:nevada      # regenerate bootstrap.json from APIs
pnpm validate:data        # Rust hard gate
pnpm check                # full lint + Rust + validate + backend audit
pnpm context:compile      # regenerate this file
pnpm deploy:pages         # deploy to Cloudflare Pages
```

## Activating Pending Connectors (priority order)
1. Nevada state checkbook — set `OPEN_BOOKS_REPORT_ID` in `tools/ingest/nevada-state-checkbook.mjs`
2. Las Vegas city — set `LAS_VEGAS_REPORT_ID` in `tools/ingest/nevada-las-vegas.mjs`
3. Clark County Socrata — verify dataset ID at data.clarkcountynv.gov, set in `tools/ingest/nevada-counties.mjs`
4. CCSD Open Book — verify OpenGov subdomain, set `CCSD_BUDGET_REPORT_ID` in `tools/ingest/nevada-ccsd.mjs`
5. RTC Southern Nevada — verify Socrata at data.rtcsnv.com

**How to find OpenGov report IDs:**
1. Open the portal URL in browser
2. DevTools → Network → filter XHR
3. Interact with the report (click filters, change dates)
4. Find API call like `/api/v1/report/{reportId}/data`
5. Copy the report ID into the ingest script

## Data-Source Runbooks
- `docs/data-sources/nevada-ccsd.md`
- `docs/data-sources/nevada-counties.md`
- `docs/data-sources/nevada-districts.md`
- `docs/data-sources/nevada-las-vegas.md`
- `docs/data-sources/nevada-state.md`

## Accuracy Rules (non-negotiable)
- "Review amount" = official source amount for priority review, NOT an allegation
- Never call a row waste/fraud/corruption unless an official enforcement source confirms it
- County + district totals can overlap federal award samples — do not sum them
- Nevada OpenBudget exclusions must be displayed in UI before claiming full state spend coverage
- Label Transparent Nevada as "independent source" — not an official state portal

## Next Steps
1. Configure real OpenGov/Socrata IDs (see Activating Pending Connectors above)
2. Run `node tools/ingest/{source}.mjs` per connector
3. `pnpm generate:nevada && pnpm validate:data`
4. `pnpm check` — must pass before commit
5. Commit + push → Cloudflare Pages auto-deploys via GitHub integration

## Files to Know
- `frontend/assets/js/app.js` — dashboard UI logic
- `frontend/assets/js/map.js` — MapLibre wrapper
- `frontend/assets/css/styles.css` — all styles
- `frontend/data/bootstrap.json` — compiled demo data (committed)
- `tools/generate-nevada-demo.mjs` — main data assembly script
- `tools/ingest/common.mjs` — shared fetch/Socrata/OpenGov utilities
- `crates/spending-validate/` — Rust validation gate
- `.github/workflows/ingest-nevada.yml` — weekly automation

---
*Regenerate anytime: `pnpm context:compile`*
