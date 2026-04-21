# Las Vegas City Data Sources

## 1. Las Vegas Open Checkbook

**Platform:** OpenGov  
**Portal:** https://www.lasvegasnevada.gov/Government/Finance/Open-Checkbook  
**Direct OpenGov URL:** https://lasvegasnevada.opengov.com (verify subdomain)  
**Data:** City expenditures by department/fund/object, FY and monthly granularity  
**Auth:** Public  
**Ingestion script:** `tools/ingest/nevada-las-vegas.mjs`

**Steps to activate:**
1. Navigate to lasvegasnevada.opengov.com
2. DevTools → Network → filter XHR to find the checkbook report API call
3. Set `LV_CHECKBOOK_REPORT_ID` in ingestion script
4. Test: `node tools/ingest/nevada-las-vegas.mjs`

## 2. Las Vegas Adopted Budget

**URL:** https://www.lasvegasnevada.gov/Government/Finance/Budget  
**Format:** OpenGov or PDF — verify for current fiscal year  
**Data:** Appropriations by department/program  
**Status:** 🟡 Verify API availability

---

## Related Cities (Future Expansion)

| City | Population | Finance URL | API |
|------|------------|-------------|-----|
| Henderson | ~340K | cityofhenderson.com/finance | Unknown |
| North Las Vegas | ~270K | cityofnorthlasvegas.com/departments/finance | Unknown |
| Boulder City | ~17K | boulder-city.com | PDF only |
| Mesquite | ~20K | mesquite.nv.gov | PDF only |
| Reno | ~270K | reno.gov/government/departments/finance | OpenGov likely |

Reno is worth prioritizing along with Washoe county — second largest metro in Nevada.

---

## Geographic Mapping

Las Vegas city expenditures map to Clark County (FIPS 32003) in the current county-level view. Future: map to Las Vegas city boundary GeoJSON from TIGER/Line `Incorporated Places` layer (StateFP=32, GEOID=4040000).

Ward boundaries: Las Vegas has 6 wards. TIGERweb `Voting Districts` layer has ward polygons. Set up `wards/city-nv-las-vegas-ward-{1-6}` region keys when ward-level data is available.

---

## Update Cadence

OpenGov checkbook: updated monthly (expenditures lag ~30-45 days).  
Budget: adopted annually, typically June-July for following fiscal year.  
GitHub Actions runs weekly and fetches latest OpenGov data automatically.
