# Source Discovery Report

Monthly portal discovery output for Nevada-first expansion. This file is intentionally timestamp-free so it only changes when source fingerprints change.

| Priority | Source | Owner | Platform | API base | Datasets / report IDs | Note |
|---|---|---|---|---|---:|---|
| live | [Nevada Open Books](https://openbooks.nv.gov) | State of Nevada | unknown | https://openbooks.nv.gov | - | fetch failed: fetch failed |
| live | [Nevada spending API](https://nevada-prod.spending.socrata.com) | State of Nevada | socrata-unverified | https://nevada-prod.spending.socrata.com | - | Socrata detected in HTML but catalog API unavailable |
| next | [Las Vegas Open Checkbook](https://lasvegasnevada.opengov.com) | City of Las Vegas | opengov | https://lasvegasnevada.opengov.com | - | OpenGov — 0 report IDs found in HTML |
| next | [Clark County Open Data](https://data.clarkcountynv.gov) | Clark County | unknown | https://data.clarkcountynv.gov | - | fetch failed: fetch failed |
| next | [RTC Southern Nevada Data](https://data.rtcsnv.com) | RTC Southern Nevada | unknown | https://data.rtcsnv.com | - | fetch failed: fetch failed |
| watch | [CCSD Finance](https://www.ccsd.net/departments/finance/) | Clark County School District | unknown | https://www.ccsd.net | - |  |
| watch | [Washoe County Finance](https://www.washoecounty.gov/finance/) | Washoe County | unknown | https://www.washoecounty.gov | - |  |

Use this report to decide which pending connector IDs to wire next. Failed probes should be manually verified before changing production ingest code.

