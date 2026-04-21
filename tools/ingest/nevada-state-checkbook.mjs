/**
 * Nevada State Checkbook + OpenBudget ingestion
 *
 * Sources:
 *   1. Nevada Open Books (openbooks.nv.gov) — state agency expenditures via OpenGov
 *      Portal: https://openbooks.nv.gov
 *      Platform: OpenGov (nevada.opengov.com)
 *      Data: checkbook-level expenditures by agency/fund/department/object
 *      Auth: public (no key required for published reports)
 *
 *   2. Nevada OpenBudget (budget.nv.gov) — Governor's adopted budget
 *      Portal: https://budget.nv.gov/OpenBudget/
 *      Platform: OpenGov
 *      Data: appropriations by agency, fund, program
 *      NOTE: Exclusion page at budget.nv.gov/OpenBudget/#exclusions must be surfaced in UI.
 *      Excluded from OpenBudget: debt service, interfund transfers, bond proceeds,
 *      some capital projects, federal pass-through to local governments.
 *
 *   3. Nevada PERS (pension) — nvpers.org
 *      Data: actuarial reports (PDF only), no public API as of 2025.
 *      Status: PDF — manual extraction required. See docs/data-sources/nevada-state.md.
 *
 * TODO before first live run:
 *   - Inspect network traffic on openbooks.nv.gov to get the live OpenGov report IDs
 *   - Confirm OpenGov API endpoint format for nevada subdomain
 *   - Map OpenGov fund/agency codes to display names
 */

import { fetchJson, loadBootstrap, saveBootstrap, saveRaw, amount, titleCase, DRY_RUN, FISCAL_YEAR } from "./common.mjs";

const OPENGOV_BASE = "https://nevada.opengov.com";

// Known OpenGov report IDs for Nevada (verify by inspecting openbooks.nv.gov network tab)
// TODO: confirm these IDs — they change when reports are republished
const CHECKBOOK_REPORT_ID = "TODO_checkbook_report_id";
const BUDGET_REPORT_ID = "TODO_budget_report_id";

// Exclusions per Nevada OpenBudget exclusion page
const OPEN_BUDGET_EXCLUSIONS = [
  "Debt service payments",
  "Interfund and intrafund transfers",
  "Bond proceeds and capital projects (partial)",
  "Federal pass-through funds distributed to local governments",
  "Payroll withholdings (employer share recorded separately)",
];

async function fetchCheckbook() {
  // OpenGov checkbook API — inspect network tab on openbooks.nv.gov to get real endpoint
  // Typical shape: https://{entity}.opengov.com/api/core/v1/reports/{id}?fiscalYear={fy}
  const url = `${OPENGOV_BASE}/api/core/v1/reports/${CHECKBOOK_REPORT_ID}?fiscalYear=${FISCAL_YEAR}`;
  console.log(`  Fetching Nevada state checkbook: ${url}`);

  if (CHECKBOOK_REPORT_ID === "TODO_checkbook_report_id") {
    console.warn("  SKIP: OpenGov report ID not configured. See docs/data-sources/nevada-state.md.");
    return null;
  }

  const data = await fetchJson(url);
  await saveRaw("nevada-state", `checkbook-fy${FISCAL_YEAR}.json`, data);
  return data;
}

async function fetchBudget() {
  const url = `${OPENGOV_BASE}/api/core/v1/reports/${BUDGET_REPORT_ID}?fiscalYear=${FISCAL_YEAR}`;
  console.log(`  Fetching Nevada OpenBudget: ${url}`);

  if (BUDGET_REPORT_ID === "TODO_budget_report_id") {
    console.warn("  SKIP: Budget report ID not configured.");
    return null;
  }

  const data = await fetchJson(url);
  await saveRaw("nevada-state", `budget-fy${FISCAL_YEAR}.json`, data);
  return data;
}

function buildStateLayer(checkbook, budget) {
  // TODO: transform OpenGov response into dashboard region entries
  // Each agency becomes a "package" in the packageSamples array
  // The state total feeds into the "state-nv" province budget
  return {
    stateTotalBudget: 0, // replace with sum from budget data
    stateTotalExpenditures: 0, // replace with sum from checkbook data
    packages: [], // replace with transformed agency rows
    coverageNote: `FY ${FISCAL_YEAR} state data covers official expenditures from Nevada Open Books. Excluded per Nevada OpenBudget: ${OPEN_BUDGET_EXCLUSIONS.join("; ")}.`,
  };
}

async function run() {
  console.log(`Nevada state checkbook ingestion — FY ${FISCAL_YEAR} (dry_run=${DRY_RUN})`);

  const [checkbook, budget] = await Promise.allSettled([fetchCheckbook(), fetchBudget()]);

  const checkbookData = checkbook.status === "fulfilled" ? checkbook.value : null;
  const budgetData = budget.status === "fulfilled" ? budget.value : null;

  if (!checkbookData && !budgetData) {
    console.warn("No state data fetched — bootstrap unchanged.");
    return;
  }

  const stateLayer = buildStateLayer(checkbookData, budgetData);
  console.log(`  State total (budget): $${stateLayer.stateTotalBudget.toLocaleString()}`);
  console.log(`  State total (expenditures): $${stateLayer.stateTotalExpenditures.toLocaleString()}`);
  console.log(`  Packages: ${stateLayer.packages.length}`);
  console.log(`  Coverage note: ${stateLayer.coverageNote}`);

  // TODO: merge stateLayer into bootstrap.json province + packageSamples
  // const bootstrap = await loadBootstrap();
  // ... merge logic ...
  // await saveBootstrap(bootstrap);
}

run().catch((err) => {
  console.error("nevada-state-checkbook failed:", err);
  process.exit(1);
});
