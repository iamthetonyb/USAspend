/**
 * Shared ingestion utilities for all Nevada data sources.
 * Each ingestion script imports from here rather than reimplementing HTTP,
 * retry, rate-limit, and schema helpers.
 */

import { createWriteStream, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..", "..");
const RAW_DIR = join(ROOT, "data", "raw");

export const DRY_RUN = process.env.INGEST_DRY_RUN === "true";
export const FISCAL_YEAR = process.env.FISCAL_YEAR || "2026";
export const FY_START = `${Number(FISCAL_YEAR) - 1}-10-01`;
export const FY_END = `${FISCAL_YEAR}-09-30`;

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const BACKOFF = [500, 1500, 4000];

export async function fetchJson(url, options = {}) {
  let last;
  for (let attempt = 0; attempt <= BACKOFF.length; attempt++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}: ${text.slice(0, 200)}`);
      return JSON.parse(text);
    } catch (err) {
      last = err;
      if (attempt < BACKOFF.length) {
        console.warn(`  retry ${attempt + 1} for ${url}: ${err.message}`);
        await sleep(BACKOFF[attempt]);
      }
    }
  }
  throw last;
}

export async function postJson(url, body, options = {}) {
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: JSON.stringify(body),
    ...options,
  });
}

// ── Socrata client ────────────────────────────────────────────────────────────
// Many Nevada county/city portals use Socrata (data.{jurisdiction}.gov)

export async function socrataQuery(domain, dataset4x4, { where, select, limit = 50000, offset = 0 } = {}) {
  const params = new URLSearchParams({ $limit: limit, $offset: offset });
  if (where) params.set("$where", where);
  if (select) params.set("$select", select);
  const url = `https://${domain}/resource/${dataset4x4}.json?${params}`;
  return fetchJson(url);
}

export async function socrataAll(domain, dataset4x4, options = {}) {
  const pageSize = 50_000;
  const rows = [];
  let offset = 0;
  while (true) {
    const page = await socrataQuery(domain, dataset4x4, { ...options, limit: pageSize, offset });
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

// ── OpenGov client ────────────────────────────────────────────────────────────
// Nevada Open Books (openbooks.nv.gov) and Las Vegas use OpenGov.
// OpenGov's public report API: https://{entity}.opengov.com/reports/{reportId}
// Note: OpenGov does not have a fully documented public API; endpoints below
// are derived from network inspection. Verify each endpoint before use.

export async function openGovReport(subdomain, reportId, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `https://${subdomain}.opengov.com/api/core/v1/reports/${reportId}?${qs}`;
  return fetchJson(url);
}

// ── Raw snapshot helpers ──────────────────────────────────────────────────────

export function rawDir(source) {
  const dir = join(RAW_DIR, source);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function saveRaw(source, filename, data) {
  const dir = rawDir(source);
  const path = join(dir, filename);
  if (!DRY_RUN) {
    await writeFile(path, typeof data === "string" ? data : JSON.stringify(data, null, 2));
    console.log(`  saved raw: ${path}`);
  } else {
    console.log(`  [dry-run] would save: ${path}`);
  }
  return path;
}

export async function loadRaw(source, filename) {
  const path = join(rawDir(source), filename);
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

// ── Current bootstrap helpers ─────────────────────────────────────────────────

const BOOTSTRAP = join(ROOT, "frontend", "data", "bootstrap.json");

export async function loadBootstrap() {
  const text = await readFile(BOOTSTRAP, "utf8");
  return JSON.parse(text);
}

export async function saveBootstrap(data) {
  if (DRY_RUN) {
    console.log("  [dry-run] would write bootstrap.json");
    return;
  }
  await writeFile(BOOTSTRAP, JSON.stringify(data, null, 2) + "\n");
  console.log("  wrote frontend/data/bootstrap.json");
}

// ── Number / string helpers ───────────────────────────────────────────────────

export const amount = (v) => Number(Number(v || 0).toFixed(2));

export const ascii = (v) =>
  String(v ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const titleCase = (v) =>
  ascii(v)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c) => `Mc${c.toUpperCase()}`);

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Tier classification (matches app.js logic) ────────────────────────────────

export function tier(amt) {
  if (amt >= 1_000_000_000) return "extreme";
  if (amt >= 250_000_000) return "high";
  if (amt >= 50_000_000) return "medium";
  return "low";
}

// ── Source attribution helpers ────────────────────────────────────────────────

export function sourceRecord(url, { name, fiscalYear = FISCAL_YEAR, retrievedAt = new Date().toISOString() } = {}) {
  return { url, name, fiscalYear, retrievedAt };
}
