/**
 * Clark County School District (CCSD) Open Book ingestion
 *
 * Source:
 *   CCSD Open Book financial transparency portal
 *   Portal: https://www.ccsd.net/departments/finance/ → Open Book link
 *   Direct: https://openbook.ccsd.net (or https://ccsd.opengov.com — verify)
 *   Data: school district expenditures, budget by program/function/object
 *   Budget scale: ~$3.3B annually (one of the 5 largest US school districts)
 *   Auth: public
 *
 *   CCSD also publishes:
 *   - Adopted Budget (PDF): https://www.ccsd.net/departments/finance/budget/
 *   - ACFR (PDF): https://www.ccsd.net/departments/finance/annual-reports/
 *   - Transparency reports (CSV): check finance page for downloadable CSVs
 *
 * Geographic mapping:
 *   CCSD serves Clark County (FIPS 32003).
 *   Schools are in cities: Las Vegas, Henderson, North Las Vegas, Boulder City, Mesquite.
 *   Map to Clark County region key for the county-level view.
 *   Future: map individual schools to ward/city sub-regions.
 *
 * TODO before first live run:
 *   - Confirm CCSD OpenGov subdomain or whether they use a different platform
 *   - Check if CCSD has Socrata data exports at data.ccsd.net or similar
 *   - Download and parse one ACFR to verify CSV structure
 *   - Get school-level boundary GeoJSON from TIGER Education layer
 */

import { fetchJson, socrataAll, loadBootstrap, saveBootstrap, saveRaw, amount, DRY_RUN, FISCAL_YEAR } from "./common.mjs";

// Possible CCSD data endpoints — verify one of these before live use
const CCSD_OPENGOV_BASE = "https://ccsd.opengov.com"; // most likely
const CCSD_SOCRATA_DOMAIN = "data.ccsd.net"; // less likely, check
const CCSD_BUDGET_REPORT_ID = "TODO_ccsd_report_id";

const CLARK_COUNTY_FIPS = "32003";
const CCSD_REGION_KEY = "school-nv-ccsd";

async function fetchCcsdBudget() {
  // Try OpenGov first (most common for large school districts)
  const url = `${CCSD_OPENGOV_BASE}/api/core/v1/reports/${CCSD_BUDGET_REPORT_ID}?fiscalYear=${FISCAL_YEAR}`;
  console.log(`  Fetching CCSD Open Book: ${url}`);

  if (CCSD_BUDGET_REPORT_ID === "TODO_ccsd_report_id") {
    console.warn("  SKIP: CCSD report ID not configured. Visit ccsd.net/departments/finance/ to find the Open Book link.");
    return null;
  }

  const data = await fetchJson(url);
  await saveRaw("nevada-ccsd", `budget-fy${FISCAL_YEAR}.json`, data);
  return data;
}

function transformCcsdData(raw) {
  // CCSD budget programs map to dashboard packages
  // TODO: implement once API shape is known
  if (!raw?.rows) return { packages: [], total: 0 };

  const packages = raw.rows.map((row, i) => ({
    id: `ccsd-${FISCAL_YEAR}-${i}`,
    sourceId: `https://www.ccsd.net/departments/finance/`, // TODO: link to specific program
    packageName: row.program || row.function || "CCSD Program",
    ownerName: "Clark County School District",
    ownerType: "school",
    budget: amount(row.amount),
    regionKeys: [CLARK_COUNTY_FIPS],
    provinceKeys: ["state-nv"],
    fiscalYear: FISCAL_YEAR,
  }));

  const total = packages.reduce((s, p) => s + p.budget, 0);
  return { packages, total };
}

async function run() {
  console.log(`CCSD ingestion — FY ${FISCAL_YEAR} (dry_run=${DRY_RUN})`);

  const raw = await fetchCcsdBudget();
  if (!raw) {
    console.warn("No CCSD data fetched — bootstrap unchanged.");
    return;
  }

  const { packages, total } = transformCcsdData(raw);
  console.log(`  CCSD packages: ${packages.length}`);
  console.log(`  CCSD total: $${total.toLocaleString()}`);

  // TODO: merge into bootstrap.json
  // const bootstrap = await loadBootstrap();
  // ... merge ...
  // await saveBootstrap(bootstrap);
}

run().catch((err) => {
  console.error("nevada-ccsd failed:", err);
  process.exit(1);
});
