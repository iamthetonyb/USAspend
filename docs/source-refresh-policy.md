# Source Refresh Policy

USA Spending Watch stays static on Cloudflare Pages, while GitHub Actions refreshes public artifacts on a source-aware schedule. This keeps hosting free/cheap and avoids an always-on VPS.

## Current Cron Schedule

| Cadence | UTC cron | Profile | Sources | Purpose |
|---|---:|---|---|---|
| Tue-Sat daily | `17 10 * * 2-6` | `daily-light` | Federal baseline + Nevada state checkbook | Keep live official data fresh without burning unnecessary CI minutes |
| Monday weekly | `41 10 * * 1` | `weekly-full` | Federal, state, city, county, school, district connectors | Full refresh across every configured source |
| Monthly | `23 11 2 * *` | `monthly-discovery` | Known source portals only | Detect changed/new portal APIs and dataset/report IDs |
| Manual | GitHub Actions dispatch | `manual` | Selected input or all | Targeted refresh, dry run, or discovery |

## Why This Cadence

- **USAspending.gov**: official docs say the site updates every day after the nightly data pipeline runs. Daily light refresh is justified for federal data. Ref: https://www.usaspending.gov/data/data-sources-download.pdf
- **Nevada state checkbook**: already live and cheap to fetch. Daily refresh is acceptable because the state payload is small and the workflow commits only if data changes.
- **City/county/school/district sources**: many are monthly, annual, PDF-based, or still require connector IDs. Weekly full refresh is enough until a source proves it updates faster.
- **Socrata-style portals**: Socrata exposes system fields such as `:updated_at`, useful for future incremental ingestion when a dataset ID is configured. Ref: https://dev.socrata.com/docs/system-fields.html

## Gates

The workflow refuses to commit if hard sources fail:

- Federal baseline generation must succeed.
- Nevada state checkbook must succeed for daily/weekly runs.
- Rust data validation must pass.
- Freshness check must pass:
  - `sourceMeta.generatedAt` max age: 72 hours
  - Nevada state checkbook `lastUpdated` max age: 240 hours
- Public artifact manifest must match file hashes and sizes.

Pending sources remain soft-fail until their IDs are configured:

- Las Vegas OpenGov
- Clark County / county portals
- CCSD / school sources
- Special districts

This prevents a half-broken new connector from blocking federal/state freshness, while preventing already-live data from silently disappearing.

## Manual Commands

```bash
pnpm ingest:nevada       # federal baseline + Nevada state checkbook
pnpm check:freshness     # fail if committed data is stale or missing live sources
pnpm discover:sources    # probe known pending portals and write a discovery report
pnpm check               # syntax + Rust + data + manifest + audit gate
```

## Next Improvement

For configured Socrata datasets, add a metadata-first check before downloading large tables:

1. Read source metadata or `:updated_at` max timestamp.
2. Compare against the last committed source snapshot metadata.
3. Download/merge only if upstream data changed.

That keeps the pipeline cheap as the app grows nationwide.
