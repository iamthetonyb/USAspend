# Nevada State Data Sources

## 1. Nevada Open Books (openbooks.nv.gov)

**Platform:** OpenGov  
**URL:** https://openbooks.nv.gov  
**Data:** State agency expenditures — checkbook-level by agency/fund/department/object  
**Auth:** Public (no API key required)  
**Ingestion script:** `tools/ingest/nevada-state-checkbook.mjs`

**Steps to activate:**
1. Navigate to openbooks.nv.gov in a browser
2. Open DevTools → Network tab → filter XHR
3. Interact with a checkbook report and note the API call URL + report ID
4. Set `CHECKBOOK_REPORT_ID` in the ingestion script
5. Run `node tools/ingest/nevada-state-checkbook.mjs` to verify shape

---

## 2. Nevada OpenBudget (budget.nv.gov)

**Platform:** OpenGov  
**URL:** https://budget.nv.gov/OpenBudget/  
**Exclusions page:** https://budget.nv.gov/OpenBudget/#exclusions (or similar — verify)  
**Data:** Governor's adopted budget — appropriations by agency/program/fund  
**Auth:** Public

### ⚠️ Exclusion requirement
Per official guidance, the following are **excluded from Nevada OpenBudget** and must be noted in the dashboard UI before claiming full state coverage:
- Debt service payments (General Obligation and Revenue bonds)
- Interfund and intrafund transfers
- Bond proceeds
- Capital improvement projects (partial — some are included)
- Federal pass-through amounts distributed directly to local governments
- Payroll benefit withholdings (employer share recorded in a separate fund)

**UI representation:** When the `state-nv` province is selected, display a coverage note citing these exclusions. The `coverageNote` field in bootstrap.json `provinceView.provinces[0]` carries this text.

---

## 3. Nevada PERS (Pension)

**Entity:** Nevada Public Employees' Retirement System  
**URL:** https://www.nvpers.org/  
**Data:** Actuarial valuations, benefit disbursements by member class  
**Auth:** Public (but PDF only as of 2025 — no machine-readable API confirmed)  
**Status:** 🔴 PDF manual extraction required

**Plan:** Download annual PERS Actuarial Report → extract pension disbursement table → store as `data/raw/nevada-state/pers-{year}.json` with manual review flag.

---

## 4. Transparent Nevada (transparentnevada.com)

**Operator:** Nevada Policy Research Institute (independent — NOT state government)  
**URL:** https://transparentnevada.com/salaries/  
**Data:** Public employee salaries for all Nevada government entities  
**Auth:** Public (CSV downloads, no official API)  
**Labeling:** Must be labeled as "independent source" — not an official state portal  
**Status:** 🟡 CSV download viable but requires non-official source labeling in UI

**Caution:** NPRI is an advocacy organization. Their data is sourced from public records requests and may have a lag of 1-2 fiscal years. Label clearly in the dashboard.

---

## Update Cadence

| Source | Frequency | Lag |
|--------|-----------|-----|
| Open Books | Quarterly updates | ~60 days |
| OpenBudget | Annual (post-session) | ~90 days after FY start |
| PERS | Annual | ~180 days after FY end |
| Transparent NV | Annual | ~12-18 months |

GitHub Actions ingestion cron: `tools/ingest/nevada-state-checkbook.mjs` — weekly, uses the OpenGov API endpoint for the most recent published data.
