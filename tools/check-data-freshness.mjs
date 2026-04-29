#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const DEFAULT_FILE = "frontend/data/bootstrap.json";
const DEFAULT_MAX_GENERATED_HOURS = 72;
const DEFAULT_MAX_STATE_HOURS = 240;
const REQUIRED_SOURCES = [
  "api.usaspending.gov",
  "tigerweb.geo.census.gov",
  "nevada-prod.spending.socrata.com",
];

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function ageHours(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / 36e5;
}

function fmtHours(value) {
  if (!Number.isFinite(value)) return "invalid";
  if (value < 1) return `${Math.round(value * 60)}m`;
  return `${value.toFixed(1)}h`;
}

function fail(message, failures) {
  failures.push(message);
}

function warn(message, warnings) {
  warnings.push(message);
}

const file = argValue("file", DEFAULT_FILE);
const maxGeneratedHours = Number(argValue("max-generated-hours", DEFAULT_MAX_GENERATED_HOURS));
const maxStateHours = Number(argValue("max-state-hours", DEFAULT_MAX_STATE_HOURS));
const warnOnly = hasFlag("warn-only");
const requiredSources = process.argv
  .filter((arg) => arg.startsWith("--require-source="))
  .map((arg) => arg.slice("--require-source=".length));
const sourceNeedles = requiredSources.length ? requiredSources : REQUIRED_SOURCES;

const failures = [];
const warnings = [];
const data = JSON.parse(await readFile(file, "utf8"));
const generatedAt = data.sourceMeta?.generatedAt;
const generatedAge = ageHours(generatedAt);
const sources = Array.isArray(data.sourceMeta?.sources) ? data.sourceMeta.sources : [];

if (!generatedAt) {
  fail("sourceMeta.generatedAt is missing", failures);
} else if (generatedAge > maxGeneratedHours) {
  fail(
    `bootstrap snapshot is stale: generated ${fmtHours(generatedAge)} ago, max ${maxGeneratedHours}h`,
    failures
  );
}

for (const needle of sourceNeedles) {
  if (!sources.some((source) => String(source).includes(needle))) {
    fail(`required source missing from sourceMeta.sources: ${needle}`, failures);
  }
}

if (!Array.isArray(data.regions) || data.regions.length === 0) {
  fail("regions[] is empty", failures);
}

if (!Array.isArray(data.geo?.features) || data.geo.features.length === 0) {
  fail("geo.features[] is empty", failures);
}

if (!data.summary || Number(data.summary.totalPackages) <= 0) {
  fail("summary.totalPackages is missing or zero", failures);
}

const nevada = data.provinceView?.provinces?.find((province) =>
  ["NV", "Nevada"].includes(province?.stateCode) ||
  ["NV", "Nevada"].includes(province?.id) ||
  province?.displayName === "Nevada" ||
  province?.name === "Nevada"
);

if (!nevada?.stateCheckbook) {
  fail("Nevada stateCheckbook payload is missing", failures);
} else {
  const stateAge = ageHours(nevada.stateCheckbook.lastUpdated);
  if (stateAge > maxStateHours) {
    fail(
      `Nevada state checkbook is stale: updated ${fmtHours(stateAge)} ago, max ${maxStateHours}h`,
      failures
    );
  }
  if (Number(nevada.stateCheckbook.totalAmount) <= 0) {
    fail("Nevada stateCheckbook.totalAmount is missing or zero", failures);
  }
  if (Number(nevada.stateCheckbook.agencyCount) <= 0) {
    fail("Nevada stateCheckbook.agencyCount is missing or zero", failures);
  }
}

const packageCount = Number(data.summary?.totalPackages) || 0;
const budget = Number(data.summary?.totalBudget) || 0;
warn(`snapshot generated ${fmtHours(generatedAge)} ago`, warnings);
warn(`${packageCount} public records, $${(budget / 1e9).toFixed(2)}B reviewed`, warnings);

for (const message of warnings) {
  console.log(`[freshness] ${message}`);
}

if (failures.length) {
  for (const message of failures) {
    console.error(`[freshness] FAIL: ${message}`);
  }
  if (!warnOnly) process.exit(1);
}

console.log(`[freshness] ok: ${file}`);
