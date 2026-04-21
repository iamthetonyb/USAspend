/**
 * Nevada special district financial data ingestion
 *
 * Districts in scope (by category):
 *
 * WATER / UTILITY:
 *   Las Vegas Valley Water District (LVVWD) — $500M+ budget
 *     https://www.lvvwd.com/about/finance/index.html
 *     Annual budget/ACFR PDFs, no public API confirmed
 *
 *   Southern Nevada Water Authority (SNWA)
 *     https://www.snwa.com/about/financial-information/index.html
 *     PDF-based
 *
 *   Truckee Meadows Water Authority (Washoe region)
 *     https://www.tmwa.com/about/financials/
 *     PDF-based
 *
 *   Clark County Water Reclamation District
 *     https://www.cleanwaterteam.com/about/finance/
 *
 * TRANSIT:
 *   Regional Transportation Commission of Southern Nevada (RTC)
 *     https://www.rtcsnv.com/about/finances/
 *     May have Socrata-based open data via data.rtcsnv.com
 *
 *   Regional Transportation Commission of Washoe County (RTC Washoe)
 *     https://www.rtcwashoe.com
 *
 * SCHOOL DISTRICTS (beyond CCSD):
 *   Washoe County School District (WCSD) — ~$700M budget
 *     https://www.washoeschools.net/departments/finance
 *
 *   Elko County School District
 *     PDF-based ACFR
 *
 * HEALTH:
 *   Southern Nevada Health District
 *     https://www.southernnevadahealthdistrict.org
 *
 * FIRE:
 *   Clark County Fire District No. 5
 *   Various local fire protection districts
 *
 * LEGISLATIVE / JUDICIAL DISTRICTS:
 *   Nevada State Assembly districts (42 districts)
 *   Nevada State Senate districts (21 districts)
 *   Nevada Judicial Districts (9 districts)
 *   Source: Nevada Legislature + NV Courts admin
 *   Note: these are governance boundaries, not spending entities.
 *         Spending for legislature/courts is in the state checkbook.
 *
 * Strategy:
 *   Tier 1 (API/Socrata): RTC SNV if data portal exists
 *   Tier 2 (PDF ACFR): LVVWD, SNWA, TMWA, water reclamation districts
 *   Tier 3 (manual): smaller fire/health districts
 *
 * TODO before first live run:
 *   - Verify RTC SNV Socrata endpoint
 *   - Set up PDF download pipeline for LVVWD, SNWA ACFRs
 *   - Confirm WCSD data source (OpenGov or PDF)
 *   - Map each district to geographic boundaries (TIGERweb special districts layer)
 */

import { socrataAll, fetchJson, loadBootstrap, saveBootstrap, saveRaw, amount, DRY_RUN, FISCAL_YEAR } from "./common.mjs";

// RTC Southern Nevada — check https://data.rtcsnv.com for active datasets
const RTC_SNV_SOCRATA_DOMAIN = "data.rtcsnv.com"; // verify this domain
const RTC_SNV_BUDGET_4X4 = "TODO_rtc_snv_dataset_id";

// District identifier mapping for geographic linkage
const DISTRICT_REGIONS = {
  "lvvwd": { name: "Las Vegas Valley Water District", counties: ["32003"] },
  "snwa": { name: "Southern Nevada Water Authority", counties: ["32003"] },
  "rtc-snv": { name: "RTC Southern Nevada", counties: ["32003"] },
  "rtc-washoe": { name: "RTC Washoe County", counties: ["32031"] },
  "wcsd": { name: "Washoe County School District", counties: ["32031"] },
};

async function fetchRtcSnv() {
  if (RTC_SNV_BUDGET_4X4 === "TODO_rtc_snv_dataset_id") {
    console.warn("  SKIP: RTC SNV dataset ID not configured.");
    console.warn("  Check https://data.rtcsnv.com for available datasets.");
    return null;
  }

  console.log(`  Fetching RTC Southern Nevada from Socrata...`);
  const rows = await socrataAll(RTC_SNV_SOCRATA_DOMAIN, RTC_SNV_BUDGET_4X4, {
    where: `fiscal_year = '${FISCAL_YEAR}'`,
  });
  await saveRaw("nevada-districts", `rtc-snv-fy${FISCAL_YEAR}.json`, rows);
  return rows;
}

function buildDistrictPackage(districtKey, rows) {
  const info = DISTRICT_REGIONS[districtKey];
  if (!info || !rows?.length) return [];

  const total = rows.reduce((s, r) => s + amount(r.amount || r.budget || 0), 0);
  return [{
    id: `district-${districtKey}-${FISCAL_YEAR}`,
    sourceId: `https://data.rtcsnv.com/resource/${RTC_SNV_BUDGET_4X4}.json`,
    packageName: info.name,
    ownerName: info.name,
    ownerType: "district",
    budget: total,
    regionKeys: info.counties,
    provinceKeys: ["state-nv"],
    fiscalYear: FISCAL_YEAR,
  }];
}

async function run() {
  console.log(`Nevada districts ingestion — FY ${FISCAL_YEAR} (dry_run=${DRY_RUN})`);

  const rtcRows = await fetchRtcSnv();
  // TODO: add WCSD, LVVWD, SNWA fetchers

  const packages = [
    ...buildDistrictPackage("rtc-snv", rtcRows),
    // TODO: add other district packages
  ];

  console.log(`  District packages: ${packages.length}`);

  if (!packages.length) {
    console.warn("No district data fetched — bootstrap unchanged.");
    return;
  }

  // TODO: merge into bootstrap.json
}

run().catch((err) => {
  console.error("nevada-districts failed:", err);
  process.exit(1);
});
