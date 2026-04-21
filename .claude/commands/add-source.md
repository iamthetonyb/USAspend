# /add-source — Add a New Data Source Connector

Scaffolds a new ingestion connector end-to-end.

## Current connectors (live at invocation)

**Existing ingest scripts:**
```
$(!ls tools/ingest/*.mjs 2>/dev/null | xargs -I{} basename {} || echo "none")
```

**Current status table:**
```
$(!grep "^|" docs/nevada-data-runbook.md 2>/dev/null | grep -v "^| Layer\|^|---" | head -20 || echo "see docs/nevada-data-runbook.md")
```

**Existing data-source runbooks:**
```
$(!ls docs/data-sources/*.md 2>/dev/null | xargs -I{} basename {} || echo "none")
```

---

## Ask the user for

1. Source name slug (e.g., `henderson-city`, `washoe-county`, `nvdot`)
2. Platform: `opengov` | `socrata` | `pdf-acfr` | `custom`
3. Entity type: city | county | school-district | utility | transit | state-agency
4. Region: name + FIPS code if known
5. Est. annual budget (rough)
6. Portal URL (if known)

---

## Steps

### 1. Create ingest script
Copy closest existing stub matching the platform:
- OpenGov → model on `tools/ingest/nevada-las-vegas.mjs`
- Socrata → model on Clark County block in `tools/ingest/nevada-counties.mjs`
- PDF ACFR → model on Washoe block in `tools/ingest/nevada-counties.mjs`

Name: `tools/ingest/nevada-{slug}.mjs`

Include clear TODO markers with exact DevTools instructions for finding the report/dataset ID.

### 2. Create doc runbook
Create `docs/data-sources/nevada-{slug}.md` covering:
- Entity name, budget, region, FIPS
- Primary source URL + platform
- Step-by-step activation (how to find IDs)
- Data structure → dashboard field mapping
- Update cadence

### 3. Add workflow step
In `.github/workflows/ingest-nevada.yml`:
```yaml
- name: Ingest {Entity Name}
  run: node tools/ingest/nevada-{slug}.mjs
  continue-on-error: true
```

### 4. Add to status runbook
In `docs/nevada-data-runbook.md` status table:
```
| {Layer} | {Source platform} | 🔴 Pending — {what needs config} |
```

### 5. Refresh context
```bash
node tools/compile-context.mjs
```
Confirm new source appears under Pending in output.

### 6. Syntax check
```bash
node --check tools/ingest/nevada-{slug}.mjs
```

---

## Report back

List:
- Files created (script path, runbook path)
- What needs to be configured to activate (exact env var or constant name)
- Test command: `node tools/ingest/nevada-{slug}.mjs`
- `node tools/compile-context.mjs` summary line

---

## Platform quick-ref

**OpenGov** (Nevada state, Las Vegas, CCSD):
- Open portal → DevTools Network XHR → interact with report → find `/api/v1/report/{id}/data`
- Set `REPORT_ID` constant in script

**Socrata** (Clark County, RTC SNV):
- Portal: `https://{domain}/resource/{4x4}.json`
- Find 4×4 from portal → API Docs → copy from URL
- Use `socrataAll()` from `tools/ingest/common.mjs`

**PDF ACFR** (Washoe, Carson City, small counties):
- Download from finance dept website
- Extract key totals manually or with `pdftotext`
- Store in `data/raw/{source}/extracted-{fy}.json`
