/**
 * Nevada county-level financial data ingestion
 *
 * Counties in scope (prioritized by population/budget size):
 *
 * 1. Clark County (FIPS 32003) — ~$2.7B budget
 *    Portal: https://www.clarkcountynv.gov/departments/finance_and_budget/
 *    Data portal: https://data.clarkcountynv.gov (Socrata — verify datasets)
 *    Possible datasets: finance expenditures, contracts
 *    ACFR: https://www.clarkcountynv.gov/departments/finance_and_budget/financial-information/annual-reports.php
 *    Status: Socrata portal exists — check for expenditure dataset ID
 *
 * 2. Washoe County (FIPS 32031) — ~$700M budget
 *    Portal: https://www.washoecounty.gov/finance/
 *    Data: https://data.washoecounty.gov (Socrata — verify)
 *    ACFR: https://www.washoecounty.gov/finance/acfr.php
 *    Status: may be PDF-only
 *
 * 3. Carson City (FIPS 32510) — consolidated city-county, ~$200M budget
 *    Portal: https://www.carson.org/government/departments/finance
 *    ACFR: https://www.carson.org/government/departments/finance/financial-reports
 *    Status: likely PDF-only
 *
 * 4. Remaining 14 counties (lower priority — PDF ACFRs only for now):
 *    Churchill, Douglas, Elko, Esmeralda, Eureka, Humboldt, Lander,
 *    Lincoln, Lyon, Mineral, Nye, Pershing, Storey, White Pine
 *
 * PDF/ACFR strategy for counties without APIs:
 *   - Download ACFR PDF annually
 *   - Use pdftotext or AI-assisted extraction to pull Schedule of Revenues/Expenditures
 *   - Store extracted totals in data/raw/counties/{fips}/acfr-{year}.json
 *   - Manual review required before publishing
 *
 * TODO before first live run:
 *   - Verify Clark County Socrata dataset IDs at data.clarkcountynv.gov
 *   - Check if Washoe County has a Socrata portal
 *   - Set up PDF download + extraction workflow for remaining counties
 */

import { socrataAll, loadBootstrap, saveBootstrap, saveRaw, amount, DRY_RUN, FISCAL_YEAR } from "./common.mjs";

// Clark County Socrata — verify these dataset IDs at data.clarkcountynv.gov
const CLARK_SOCRATA_DOMAIN = "data.clarkcountynv.gov";
const CLARK_EXPENDITURES_4X4 = "TODO_clark_dataset_id"; // e.g., "xk4d-3r9z"

// County FIPS → region key mapping (must match generate-nevada-demo.mjs)
const COUNTY_MAP = {
  "32003": { name: "Clark County", regionKey: "county-nv-003" },
  "32031": { name: "Washoe County", regionKey: "county-nv-031" },
  "32510": { name: "Carson City", regionKey: "county-nv-510" },
};

async function fetchClarkCounty() {
  if (CLARK_EXPENDITURES_4X4 === "TODO_clark_dataset_id") {
    console.warn("  SKIP: Clark County Socrata dataset ID not configured.");
    console.warn("  Visit https://data.clarkcountynv.gov and search 'expenditure' to find the dataset ID.");
    return null;
  }

  console.log(`  Fetching Clark County expenditures from Socrata (${CLARK_SOCRATA_DOMAIN})...`);
  const rows = await socrataAll(CLARK_SOCRATA_DOMAIN, CLARK_EXPENDITURES_4X4, {
    where: `fiscal_year = '${FISCAL_YEAR}'`,
    select: "department,fund,amount,category",
  });
  console.log(`  Clark County: ${rows.length} rows`);
  await saveRaw("nevada-counties", `clark-fy${FISCAL_YEAR}.json`, rows);
  return rows;
}

function transformCountyRows(fips, rows) {
  const info = COUNTY_MAP[fips];
  if (!info || !rows?.length) return [];

  // Aggregate by department into packages
  const byDept = {};
  for (const row of rows) {
    const dept = row.department || "General";
    byDept[dept] = (byDept[dept] || 0) + amount(row.amount);
  }

  return Object.entries(byDept).map(([dept, total], i) => ({
    id: `county-${fips}-${FISCAL_YEAR}-${i}`,
    sourceId: `https://data.clarkcountynv.gov/resource/${CLARK_EXPENDITURES_4X4}.json`,
    packageName: dept,
    ownerName: info.name,
    ownerType: "county",
    budget: total,
    regionKeys: [info.regionKey],
    provinceKeys: ["state-nv"],
    fiscalYear: FISCAL_YEAR,
  }));
}

async function run() {
  console.log(`Nevada county ingestion — FY ${FISCAL_YEAR} (dry_run=${DRY_RUN})`);

  const clarkRows = await fetchClarkCounty();

  const packages = [
    ...transformCountyRows("32003", clarkRows),
    // TODO: add Washoe, Carson City once their APIs are identified
  ];

  console.log(`  County packages total: ${packages.length}`);
  console.log(`  County spend total: $${packages.reduce((s, p) => s + p.budget, 0).toLocaleString()}`);

  if (!packages.length) {
    console.warn("No county data fetched — bootstrap unchanged.");
    return;
  }

  // TODO: merge into bootstrap.json
}

run().catch((err) => {
  console.error("nevada-counties failed:", err);
  process.exit(1);
});
