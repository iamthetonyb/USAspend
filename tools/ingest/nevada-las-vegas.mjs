/**
 * Las Vegas city checkbook + open budget ingestion
 *
 * Sources:
 *   1. Las Vegas Open Checkbook (OpenGov)
 *      Portal: https://lasvegasnevada.opengov.com
 *      Or: https://www.lasvegasnevada.gov/Government/Finance/Open-Checkbook
 *      Data: expenditures by department/fund/object, FY granularity
 *      Auth: public
 *
 *   2. Las Vegas Adopted Budget
 *      Portal: https://www.lasvegasnevada.gov/Government/Finance/Budget
 *      Format: OpenGov or PDF — verify current year format
 *      Data: appropriations by department/program
 *
 *   3. Henderson, North Las Vegas, Boulder City (optional future expansion)
 *      Henderson: https://www.cityofhenderson.com/finance
 *      North Las Vegas: https://www.cityofnorthlasvegas.com/departments/finance
 *
 * TODO before first live run:
 *   - Confirm Las Vegas OpenGov subdomain (lasvegasnevada vs lasvegas)
 *   - Inspect network traffic on lasvegasnevada.opengov.com for report IDs
 *   - Map OpenGov department codes to standard display names
 *   - Confirm whether Henderson/N. Las Vegas are in scope for this iteration
 */

import { fetchJson, loadBootstrap, saveBootstrap, saveRaw, amount, DRY_RUN, FISCAL_YEAR } from "./common.mjs";

const OPENGOV_LV_BASE = "https://lasvegasnevada.opengov.com";

// TODO: get real report IDs by inspecting network tab on the portal
const LV_CHECKBOOK_REPORT_ID = "TODO_lv_checkbook_report_id";
const LV_BUDGET_REPORT_ID = "TODO_lv_budget_report_id";

// Clark County FIPS for geographic mapping
const CLARK_COUNTY_FIPS = "32003";
const LV_REGION_KEY = "city-nv-las-vegas";

async function fetchLvCheckbook() {
  const url = `${OPENGOV_LV_BASE}/api/core/v1/reports/${LV_CHECKBOOK_REPORT_ID}?fiscalYear=${FISCAL_YEAR}`;
  console.log(`  Fetching Las Vegas checkbook: ${url}`);

  if (LV_CHECKBOOK_REPORT_ID === "TODO_lv_checkbook_report_id") {
    console.warn("  SKIP: Las Vegas OpenGov report ID not configured.");
    return null;
  }

  const data = await fetchJson(url);
  await saveRaw("nevada-las-vegas", `checkbook-fy${FISCAL_YEAR}.json`, data);
  return data;
}

function transformLvData(raw) {
  // TODO: transform OpenGov rows into dashboard package format
  // Expected OpenGov response shape:
  // { rows: [{ department: string, fund: string, amount: number, ... }] }
  if (!raw?.rows) return [];
  return raw.rows.map((row, i) => ({
    id: `lv-${FISCAL_YEAR}-${i}`,
    sourceId: `https://lasvegasnevada.opengov.com/checkbook/${i}`, // TODO: use real record URL
    packageName: row.department || "Unknown Department",
    ownerName: "City of Las Vegas",
    ownerType: "city",
    budget: amount(row.amount),
    regionKeys: [CLARK_COUNTY_FIPS], // map to Clark County geography
    provinceKeys: ["state-nv"],
    fiscalYear: FISCAL_YEAR,
  }));
}

async function run() {
  console.log(`Las Vegas city ingestion — FY ${FISCAL_YEAR} (dry_run=${DRY_RUN})`);

  const raw = await fetchLvCheckbook();
  if (!raw) {
    console.warn("No Las Vegas data fetched — bootstrap unchanged.");
    return;
  }

  const packages = transformLvData(raw);
  console.log(`  Las Vegas packages: ${packages.length}`);
  console.log(`  Las Vegas total: $${packages.reduce((s, p) => s + p.budget, 0).toLocaleString()}`);

  // TODO: merge into bootstrap.json
  // const bootstrap = await loadBootstrap();
  // ... merge packages into bootstrap.packageSamples, update Clark County region budget ...
  // await saveBootstrap(bootstrap);
}

run().catch((err) => {
  console.error("nevada-las-vegas failed:", err);
  process.exit(1);
});
