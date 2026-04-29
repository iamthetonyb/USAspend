#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { discoverPortal, sleep } from "./ingest/common.mjs";

const PORTALS = [
  {
    name: "Nevada Open Books",
    url: "https://openbooks.nv.gov",
    priority: "live",
    owner: "State of Nevada",
  },
  {
    name: "Nevada spending API",
    url: "https://nevada-prod.spending.socrata.com",
    priority: "live",
    owner: "State of Nevada",
  },
  {
    name: "Las Vegas Open Checkbook",
    url: "https://lasvegasnevada.opengov.com",
    priority: "next",
    owner: "City of Las Vegas",
  },
  {
    name: "Clark County Open Data",
    url: "https://data.clarkcountynv.gov",
    priority: "next",
    owner: "Clark County",
  },
  {
    name: "RTC Southern Nevada Data",
    url: "https://data.rtcsnv.com",
    priority: "next",
    owner: "RTC Southern Nevada",
  },
  {
    name: "CCSD Finance",
    url: "https://www.ccsd.net/departments/finance/",
    priority: "watch",
    owner: "Clark County School District",
  },
  {
    name: "Washoe County Finance",
    url: "https://www.washoecounty.gov/finance/",
    priority: "watch",
    owner: "Washoe County",
  },
];

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function markdown(results) {
  const lines = [
    "# Source Discovery Report",
    "",
    "Monthly portal discovery output for Nevada-first expansion. This file is intentionally timestamp-free so it only changes when source fingerprints change.",
    "",
    "| Priority | Source | Owner | Platform | API base | Datasets / report IDs | Note |",
    "|---|---|---|---|---|---:|---|",
  ];

  for (const item of results) {
    const datasetCount = Array.isArray(item.datasets) ? item.datasets.length : 0;
    const datasetPreview = datasetCount
      ? item.datasets
          .slice(0, 5)
          .map((dataset) => dataset.id || dataset.name)
          .filter(Boolean)
          .join(", ")
      : "-";
    const datasetText = datasetCount > 5 ? `${datasetPreview}, ... (${datasetCount})` : datasetPreview;
    lines.push(
      `| ${item.priority} | [${item.name}](${item.url}) | ${item.owner} | ${item.platform || "unknown"} | ${
        item.apiBase || "-"
      } | ${datasetText.replace(/\|/g, "/")} | ${(item.note || "").replace(/\|/g, "/")} |`
    );
  }

  lines.push(
    "",
    "Use this report to decide which pending connector IDs to wire next. Failed probes should be manually verified before changing production ingest code.",
    ""
  );
  return `${lines.join("\n")}\n`;
}

const output = argValue("output", "");
const results = [];

for (const portal of PORTALS) {
  console.log(`[discover] ${portal.name}: ${portal.url}`);
  try {
    const result = await discoverPortal(portal.url);
    results.push({
      ...portal,
      platform: result.platform,
      apiBase: result.apiBase,
      datasets: result.datasets || [],
      note: result.note || "",
      spendingBase: result.spendingBase || "",
    });
  } catch (error) {
    results.push({
      ...portal,
      platform: "error",
      apiBase: "",
      datasets: [],
      note: error instanceof Error ? error.message : String(error),
      spendingBase: "",
    });
  }
  await sleep(600);
}

const md = markdown(results);
console.log(md);

if (output) {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, md);
  console.log(`[discover] wrote ${output}`);
}
