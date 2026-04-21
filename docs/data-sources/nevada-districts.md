# Nevada Special District Data Sources

## Water / Utility

### Las Vegas Valley Water District (LVVWD)
**Budget:** ~$500M+ annually  
**URL:** https://www.lvvwd.com/about/finance/index.html  
**Data:** Annual budget PDF, ACFR PDF  
**API:** None confirmed — PDF extraction required  
**Region:** Clark County (FIPS 32003)  
**Status:** 🔴 PDF only

### Southern Nevada Water Authority (SNWA)
**URL:** https://www.snwa.com/about/financial-information/index.html  
**Data:** Annual budget + ACFR PDFs  
**API:** None confirmed  
**Region:** Clark County (and adjacent Southern Nevada)  
**Status:** 🔴 PDF only

**Note:** LVVWD and SNWA are closely related (LVVWD delivers retail water; SNWA is wholesale authority). Their budgets partially overlap — do not double-count.

### Clark County Water Reclamation District
**URL:** https://www.cleanwaterteam.com/about/finance/  
**Region:** Clark County  
**Status:** 🔴 PDF only

### Truckee Meadows Water Authority
**URL:** https://www.tmwa.com/about/financials/  
**Region:** Washoe County  
**Status:** 🔴 PDF only

---

## Transit

### RTC Southern Nevada (Regional Transportation Commission)
**Budget:** ~$600M+  
**URL:** https://www.rtcsnv.com/about/finances/  
**Data portal:** https://data.rtcsnv.com (verify — may have Socrata datasets)  
**Region:** Clark County, Henderson, North Las Vegas, Boulder City  
**Ingestion script:** `tools/ingest/nevada-districts.mjs`  
**Status:** 🟡 Check Socrata portal for budget/expenditure datasets

### RTC Washoe County
**URL:** https://www.rtcwashoe.com  
**Region:** Washoe County (Reno/Sparks)  
**Status:** 🔴 PDF likely

---

## School Districts (beyond CCSD)

### Washoe County School District (WCSD)
**Budget:** ~$700M  
**URL:** https://www.washoeschools.net/departments/finance  
**Platform:** Possibly OpenGov (verify)  
**Region:** Washoe County  
**Ingestion script:** extend `tools/ingest/nevada-ccsd.mjs` or create `nevada-wcsd.mjs`  
**Status:** 🟡 Check for OpenGov or Socrata API

### Elko County School District
**Budget:** ~$80M  
**Status:** 🔴 PDF only

---

## Health

### Southern Nevada Health District
**URL:** https://www.southernnevadahealthdistrict.org  
**Region:** Clark County  
**Status:** 🔴 PDF only

---

## Legislative / Judicial Districts (boundaries, not separate budget entities)

These are **geographic boundaries** — their spending is in the state checkbook, not separate.

| Type | Count | Source |
|------|-------|--------|
| State Assembly Districts | 42 | TIGERweb State Legislative Districts layer |
| State Senate Districts | 21 | TIGERweb State Legislative Districts layer |
| Congressional Districts | 4 | TIGERweb 119th Congressional Districts layer |
| State Judicial Districts | 9 | Nevada Courts admin, NRS Chapter 3 |

**Implementation:** Pull boundary GeoJSON from TIGERweb; aggregate USAspending and state checkbook data by district overlap. Congressional districts already implemented in `generate-nevada-demo.mjs`.

---

## Priority Order

1. **RTC SNV** — verify Socrata, automate if available
2. **WCSD** — second-largest school district, verify OpenGov
3. **LVVWD** — largest utility, PDF extraction
4. **SNWA** — combined with LVVWD pipeline
5. **RTC Washoe** — pair with Washoe county work
6. Remaining smaller districts: annual PDF batch

---

## District Geographic Boundaries

TIGERweb layers for district boundaries:
- School districts: `TIGERweb/tigerWMS_Current/MapServer/12` (Unified School Districts)
- Water/special districts: Not in standard TIGER — use district-published shapefiles
- Transit boundaries: RTC publishes service area shapefiles on their data portal
