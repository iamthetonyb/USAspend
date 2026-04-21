#!/usr/bin/env node
/**
 * discover-portal.mjs — probe any government portal and identify its API
 *
 * Usage: node tools/discover-portal.mjs https://checkbook.nv.gov
 *        node tools/discover-portal.mjs https://data.clarkcountynv.gov
 *        node tools/discover-portal.mjs https://lasvegasnevada.opengov.com
 *
 * Returns: platform type, API base URL, available datasets/report IDs
 * Supports: Tyler OpenFinance, Socrata, OpenGov, custom JSON APIs
 */

import { discoverPortal } from "./ingest/common.mjs";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node tools/discover-portal.mjs <url>");
  console.error("Examples:");
  console.error("  node tools/discover-portal.mjs https://checkbook.nv.gov");
  console.error("  node tools/discover-portal.mjs https://data.clarkcountynv.gov");
  console.error("  node tools/discover-portal.mjs https://lasvegasnevada.opengov.com");
  process.exit(1);
}

console.log(`Probing: ${url}\n`);
const result = await discoverPortal(url);

console.log(`Platform:  ${result.platform}`);
console.log(`API Base:  ${result.apiBase}`);
console.log(`Note:      ${result.note}`);
if (result.spendingBase) console.log(`Spending:  ${result.spendingBase}`);

if (result.datasets?.length > 0) {
  console.log(`\nDatasets (${result.datasets.length}):`);
  result.datasets.slice(0, 20).forEach(d => {
    const amt = d.totalAmount ? ` — $${(d.totalAmount/1e9).toFixed(1)}B` : "";
    const yrs = d.years ? ` (${d.years.join(",")})` : "";
    console.log(`  ${d.id}  ${d.name || ""}${amt}${yrs}`);
  });
}

console.log(`\nFull result:\n${JSON.stringify(result, null, 2)}`);
