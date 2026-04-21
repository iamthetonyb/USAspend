# Nevada County Data Sources

Nevada has 16 counties + Carson City (consolidated city-county). Prioritized by budget size.

## Clark County (FIPS 32003) — ~$2.7B budget

**Portal:** https://www.clarkcountynv.gov/departments/finance_and_budget/  
**Data portal:** https://data.clarkcountynv.gov (Socrata — verify active finance datasets)  
**ACFR:** https://www.clarkcountynv.gov/departments/finance_and_budget/financial-information/annual-reports.php  
**Status:** 🟡 Socrata portal likely has expenditure data — verify dataset IDs

**Steps to activate:**
1. Browse data.clarkcountynv.gov → filter by category "Finance" or "Budget"
2. Find the expenditure/checkbook dataset
3. Set `CLARK_EXPENDITURES_4X4` in `tools/ingest/nevada-counties.mjs`
4. Test with `node tools/ingest/nevada-counties.mjs`

---

## Washoe County (FIPS 32031) — ~$700M budget

**Portal:** https://www.washoecounty.gov/finance/  
**Data:** https://data.washoecounty.gov (Socrata — verify)  
**ACFR:** washoecounty.gov/finance/acfr.php  
**Status:** 🔴 Likely PDF only — check if Socrata portal exists

---

## Carson City (FIPS 32510) — ~$200M budget

Consolidated city-county (Nevada's only consolidated government).  
**Portal:** https://www.carson.org/government/departments/finance  
**ACFR:** https://www.carson.org/government/departments/finance/financial-reports  
**Status:** 🔴 PDF only — manual ACFR extraction required

---

## Remaining 13 Counties (lower priority)

| County | FIPS | Est. Budget | Source |
|--------|------|-------------|--------|
| Douglas | 32005 | ~$100M | PDF ACFR |
| Elko | 32007 | ~$150M | PDF ACFR |
| Humboldt | 32013 | ~$60M | PDF ACFR |
| Nye | 32023 | ~$80M | PDF ACFR |
| Lyon | 32019 | ~$70M | PDF ACFR |
| Churchill | 32001 | ~$50M | PDF ACFR |
| Storey | 32029 | ~$15M | PDF ACFR |
| Lander | 32015 | ~$30M | PDF ACFR |
| Mineral | 32021 | ~$10M | PDF ACFR |
| Esmeralda | 32009 | ~$5M | PDF ACFR |
| Lincoln | 32017 | ~$15M | PDF ACFR |
| Eureka | 32011 | ~$20M | PDF ACFR |
| White Pine | 32033 | ~$30M | PDF ACFR |
| Pershing | 32027 | ~$15M | PDF ACFR |

---

## PDF ACFR Extraction Strategy

For counties without APIs:
1. Download ACFR from county finance website (annual, usually published 6 months post-FY)
2. Extract Schedule of Revenues, Expenditures and Changes in Fund Balances (Government Funds)
3. Store totals in `data/raw/counties/{fips}/acfr-{year}.json` with source URL + date
4. Manual review before publishing
5. Mark as `sourceType: "acfr-pdf"` in package metadata

---

## Update Cadence

API-based (Clark, Washoe if portal exists): monthly via GitHub Actions.  
PDF-based: annually, triggered manually after ACFR publication (typically March-June).
