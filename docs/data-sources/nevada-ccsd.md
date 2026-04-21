# Clark County School District (CCSD) Data Sources

**Entity:** Clark County School District  
**Budget:** ~$3.3B annually (one of the 5 largest US school districts)  
**Students:** ~300,000 (5th largest US district by enrollment)  
**Region:** Clark County, Nevada  
**Ingestion script:** `tools/ingest/nevada-ccsd.mjs`

---

## Primary Source: CCSD Open Book

**URL:** https://www.ccsd.net/departments/finance/ → Open Book link  
**Platform:** OpenGov (verify at ccsd.opengov.com)  
**Data:** Expenditures by fund/program/function/object  
**Auth:** Public  
**Status:** 🟡 Verify OpenGov subdomain

**Steps to activate:**
1. Navigate to ccsd.net/departments/finance and find the "Open Book" link
2. Inspect network traffic to identify OpenGov subdomain and report ID
3. Set `CCSD_BUDGET_REPORT_ID` in `tools/ingest/nevada-ccsd.mjs`
4. Test: `node tools/ingest/nevada-ccsd.mjs`

---

## Secondary Sources

**Adopted Budget (PDF):**  
https://www.ccsd.net/departments/finance/budget/  
Published each June for the following year. PDF extraction needed for breakdown.

**ACFR (PDF):**  
https://www.ccsd.net/departments/finance/annual-reports/  
Published ~6 months post-fiscal-year. Most reliable for final actuals.

---

## Data Structure

CCSD budget uses the USFR (Uniform System of Financial Records for School Districts):
- **Fund:** General, Special Revenue, Capital Projects, Debt Service
- **Program:** Instruction, Student Support, Instructional Support, Administration, etc.
- **Function:** Classroom Instruction, Guidance, Libraries, etc.
- **Object:** Salaries, Benefits, Purchased Services, Supplies, Capital Outlay

Map to dashboard:
- Program/Function combos → `packageName`
- Fund → filter/owner grouping
- Amount → `budget`

---

## School-Level Boundary Data (Future)

CCSD has 350+ schools with geographic locations. For school-level drill-down:
- School coordinates: https://data.nv.gov or CCSD published spreadsheet
- School district boundaries: TIGERweb layer 12 (Unified School Districts)
- Individual school zones: not in TIGER — would need CCSD GIS data

---

## Update Cadence

OpenGov (if available): monthly expenditure updates, lag ~30-45 days.  
Adopted Budget: annually (June-July).  
ACFR: annually (December-March of following year).
