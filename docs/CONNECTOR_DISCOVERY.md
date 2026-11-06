# Connector discovery notes

Findings from the "more sources" pass. Four new keyless adapters were built
and verified against live APIs. Fixtures are real snapshots captured on
2026-08-25 with the exact curl commands below.

## Adapters built

| Adapter | Source | Endpoint | Fixture |
| --- | --- | --- | --- |
| `lawa` | LAWA (Land, Air, Water Aotearoa) | `https://www.lawa.org.nz/umbraco/api/mapservice/RiverQualitySites` | `lawa-river-quality-sites-2026-08-25.json` |
| `mfe` | MfE Data Service (Koordinates) | `https://data.mfe.govt.nz/services/api/v1/layers?search=water` | `mfe-layer-search-water-2026-08-25.json` |
| `lris` | LRIS, Landcare Research (Koordinates) | `https://lris.scinfo.org.nz/services/api/v1/layers?search=soil` | `lris-layer-search-soil-2026-08-25.json` |
| `nzta` | Waka Kotahi journeys | `https://www.journeys.nzta.govt.nz/api/hotspots` | `nzta-holiday-hotspots-2026-08-25.json` |

All four are keyless, return JSON, and were stable across repeated fetches
(identical payloads on two consecutive calls). All four are registered in
`registry.ts`.

## Exact curl commands

```sh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

# LAWA river quality sites (1.6k sites + region boundaries; adapter drops boundaries)
curl -sS -L -A "$UA" "https://www.lawa.org.nz/umbraco/api/mapservice/RiverQualitySites" \
  -o lawa-river-quality-sites-2026-08-25.json

# MfE Data Service layer search (Koordinates API, same shape as LINZ)
curl -sS -L -A "$UA" "https://data.mfe.govt.nz/services/api/v1/layers?search=water" \
  -o mfe-layer-search-water-2026-08-25.json

# LRIS (Landcare Research) layer search (Koordinates API)
curl -sS -L -A "$UA" "https://lris.scinfo.org.nz/services/api/v1/layers?search=soil" \
  -o lris-layer-search-soil-2026-08-25.json

# Waka Kotahi holiday hotspots (needs Accept: application/json)
curl -sS -L -A "$UA" -H "Accept: application/json" \
  "https://www.journeys.nzta.govt.nz/api/hotspots" \
  -o nzta-holiday-hotspots-2026-08-25.json
```

## Findings table

| Source | Status | Notes |
| --- | --- | --- |
| LAWA `lawa.org.nz` | LIVE | Umbraco JSON API under `/umbraco/api/`. `RiverQualitySites`, `swimsites`, `GetAllLakeSites` all return JSON keyless. `FlowSites`, `MonitoringSites`, `flowstats` return `[]`; `airservice/getLatestSample` 404s. |
| MfE Data Service `data.mfe.govt.nz` | LIVE | Koordinates platform. `/services/api/v1/layers?search=...` works keyless. `/arcgis/rest/services?f=pjson` returns "Output format not supported" (no ArcGIS REST). |
| LRIS `lris.scinfo.org.nz` (Landcare Research) | LIVE | Koordinates platform. `/services/api/v1/layers?search=...` works keyless. |
| Waka Kotahi `journeys.nzta.govt.nz` | LIVE | `/api/hotspots` returns JSON only with `Accept: application/json` header; otherwise 400 "API only accepts JSON requests". Holiday journey hotspots as GeoJSON. |
| Horizons `data.horizons.govt.nz` | BLOCKED | Redirects to ArcGIS Hub portal HTML; no keyless JSON API found. |
| ECan `data.ecan.govt.nz` | BLOCKED | 403 on ArcGIS REST services. |
| Waikato `data.waikatoregion.govt.nz` | BLOCKED | Connection timeout. |
| HBRC `data.hbrc.govt.nz` | BLOCKED | 404 on ArcGIS REST services. |
| Environment Southland `data.es.govt.nz` | BLOCKED | 404 on ArcGIS REST services. |
| Marlborough `data.marlborough.govt.nz` | BLOCKED | SSL certificate error. |
| West Coast `data.wcrc.govt.nz` | BLOCKED | Self-signed certificate. |
| Auckland Council `data.lbr.aucklandcouncil.govt.nz` | DEAD | DNS does not resolve. |
| BOPRC `data.boprc.govt.nz` | DEAD | DNS does not resolve. |
| NRC `data.nrc.govt.nz` | DEAD | DNS does not resolve. |
| GDC `data.gdc.govt.nz` | DEAD | DNS does not resolve. |
| TRC `data.trc.govt.nz` | DEAD | DNS does not resolve. |
| Tasman `data.tasman.govt.nz` | DEAD | DNS does not resolve. |
| Metservice | BLOCKED | SPA bundle reveals no simple keyless JSON endpoint; `publicData` paths 404. |
| NIWA `api.niwa.co.nz` | KEYED | Requires API key; skipped. |
| GNS `api.gns.cri.nz` | DEAD | DNS does not resolve. |

## Already ruled out (from mission, not retried)

educationcounts.govt.nz (403 bot-blocked), figure.nz (dead),
data1850.nz (no API), incidents.fireandemergency.nz (dead),
api.rbnz.govt.nz (403 keyed), data.doc.govt.nz (dead), data-ccc hub (401),
data-gwrc hub (400).

## 2026-10-05 addition: `nzta-open-data`

One more keyless adapter was built and registered: the Waka Kotahi (NZ Transport
Agency) open data hub catalogue, read from its DCAT 1.1 feed.

| Adapter | Source | Endpoint | Fixture |
| --- | --- | --- | --- |
| `nzta-open-data` | Waka Kotahi (NZTA) open data hub | `https://opendata-nzta.opendata.arcgis.com/api/feed/dcat-us/1.1.json` | `nzta-open-data-2026-10-05.json` |

### Exact curl command (captured 2026-10-05)

```sh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

# NZTA open data hub DCAT 1.1 catalogue feed (HTTP 200, application/json, 244 KB, 36 datasets)
curl -sS -L -A "$UA" \
  "https://opendata-nzta.opendata.arcgis.com/api/feed/dcat-us/1.1.json" \
  -o nzta-open-data-2026-10-05.json
```

The dataset search endpoint was also checked live on 2026-10-05 but is not
used by the adapter:

```sh
# GeoJSON dataset search (HTTP 200, application/geo+json, 91 KB, 11 matches for "traffic")
curl -sS -L -A "$UA" \
  "https://opendata-nzta.opendata.arcgis.com/api/search/v1/collections/dataset/items?q=traffic" \
  -o nzta-search-traffic-2026-10-05.json
```

### Shape notes

- Keyless, no API key, no headers beyond the browser User-Agent.
- Top level is a DCAT 1.1 catalog: `@type: "dcat:Catalog"` plus a `dataset` list.
- Each dataset carries `identifier`, `title`, `description`, `landingPage`,
  `keyword`, `issued`, `modified`, `publisher.name`, `contactPoint`,
  `license`, `theme`, `spatial`, and a `distribution` list.
- `theme` arrives either as a list of strings or as an empty string, so the
  parser normalizes both to a string list.
- Distribution entries carry `title`, `format`, `mediaType`, and `accessURL`.

### Licence

The feed is published by Waka Kotahi on ArcGIS Hub. Dataset licence fields
vary: the first dataset points at Creative Commons Attribution 4.0
(`https://creativecommons.org/licenses/by/4.0`), and some datasets carry
custom NZTA CC-BY 4.0 or non-commercial terms in free text. The adapter
returns the raw `license` value per dataset; check it before reuse.

### Verification status

- Verified live on 2026-10-05 from this machine with the curl above
  (`HTTP 200 application/json; charset=utf-8`, 244426 bytes, 36 datasets).
- The dataset search endpoint was verified live the same day
  (`HTTP 200 application/geo+json; charset=utf-8`, 90847 bytes).
- The unit test uses the committed fixture only. It never hits the network.
- Not verified: behaviour from non-NZ IPs, or whether the licence text is
  stable over time.

## 2026-11-06 addition: `infoshare`

Stats NZ Infoshare is an ASP.NET search application, not a JSON API. The
adapter opens the search page to get a session cookie and the ASP.NET view
state, posts the query, then reads the first results page. It returns the
table title, folder path, and last-updated date for up to 20 tables, plus the
total match count.

| Adapter | Source | Endpoint | Fixture |
| --- | --- | --- | --- |
| `infoshare` | Stats NZ Infoshare | `https://infoshare.stats.govt.nz/SearchPage.aspx` then `https://infoshare.stats.govt.nz/SearchResults.aspx` | `infoshare-search-employment-2026-11-06.html` |

### Exact curl commands (captured 2026-11-06)

```sh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
BASE="https://infoshare.stats.govt.nz"

# Start a session and capture the ASP.NET view state.
curl -sS -L -A "$UA" -c /tmp/infoshare.cookies \
  "$BASE/SearchPage.aspx" -o /tmp/infoshare-search-page.html

VIEWSTATE=$(sed -n 's/.*name="__VIEWSTATE"[^>]*value="\([^"]*\)".*/\1/p' /tmp/infoshare-search-page.html | head -1)
EVENTVALIDATION=$(sed -n 's/.*name="__EVENTVALIDATION"[^>]*value="\([^"]*\)".*/\1/p' /tmp/infoshare-search-page.html | head -1)

# Post the query. A 302 to /SearchResults.aspx is the expected response.
curl -sS -A "$UA" -b /tmp/infoshare.cookies -c /tmp/infoshare.cookies \
  -X POST --data-urlencode "__EVENTTARGET=" --data-urlencode "__EVENTARGUMENT=" \
  --data-urlencode "__VIEWSTATE=$VIEWSTATE" \
  --data-urlencode "__EVENTVALIDATION=$EVENTVALIDATION" \
  --data-urlencode "ctl00\$MainContent\$ctlSearch\$tbSearchText=employment" \
  --data-urlencode "ctl00\$MainContent\$ctlSearch\$rblSearchOptions=rbSearchOptionsOr" \
  --data-urlencode "ctl00\$MainContent\$ctlSearch\$btnSearch.x=10" \
  --data-urlencode "ctl00\$MainContent\$ctlSearch\$btnSearch.y=10" \
  -o /dev/null -w '%{http_code} %{redirect_url}\n' \
  "$BASE/SearchPage.aspx"

# Read the results page with the same session cookie.
curl -sS -L -A "$UA" -b /tmp/infoshare.cookies \
  "$BASE/SearchResults.aspx" \
  -o infoshare-search-employment-2026-11-06.html
```

### Shape notes

- Keyless. No account, API key, or extra header beyond the browser User-Agent.
- The results page is HTML. The adapter reads the result anchors, the
  `Last updated` line, the `Table path` line, the total count, and the echoed
  query from a hidden field.
- Only the first results page is returned (20 rows). Pagination uses ASP.NET
  postbacks, which the adapter does not follow.
- The live check on 2026-11-06 returned 180 tables for "employment" and a
  60,220 byte fixture.

## 2026-11-07 addition: `mbie-open-data`

The MBIE open data page at `https://www.mbie.govt.nz/about/open-data/` sits
behind an Incapsula browser challenge. The datasets are also listed in the
national data.govt.nz catalogue under the MBIE organisation, and that CKAN API
answers keyless. The adapter reads the catalogue view rather than the challenged
page.

| Adapter | Source | Endpoint | Fixture |
| --- | --- | --- | --- |
| `mbie-open-data` | Ministry of Business, Innovation and Employment (MBIE) | `https://catalogue.data.govt.nz/api/3/action/package_search?fq=organization:ministry-of-business-innovation-and-employment&rows=1000` | `mbie-open-data-2026-11-07.json` |

### Exact curl command (captured 2026-11-07)

```sh
# MBIE datasets in the national open data catalogue (HTTP 200, 34 datasets)
curl -sS --max-time 30 \
  "https://catalogue.data.govt.nz/api/3/action/package_search?fq=organization%3Aministry-of-business-innovation-and-employment&rows=1000" \
  -o mbie-open-data-2026-11-07.json
```

### Shape notes

- Keyless. No API key, account, or extra header is needed.
- Top level is the standard CKAN `package_search` response: `success: true`,
  `result.count`, and `result.results`.
- Each dataset carries `name`, `title`, `notes`, `metadata_modified`, `url`,
  `author`, `organization.title`, `license_id`, `license_title`, `license_url`,
  `rights`, and a `resources` list.
- Each resource carries `name`, `format`, `url`, and `size`. `size` can be
  null when the catalogue does not know it.
- Some fields arrive as null or are absent, including `license_title`,
  `license_url`, and `url`. The parser normalizes those to empty strings.
- The live check on 2026-11-07 returned 34 datasets in a 228,396 byte response.
  The committed fixture is the same response, pretty-printed for review. The
  list includes weekly fuel stock updates, energy statistics, tourism
  estimates, rental bond data, immigration statistics, and labour market data.

### Licence

The catalogue returns a licence per dataset. Most MBIE datasets use Creative
Commons Attribution 4.0 International or Creative Commons Attribution 3.0 New
Zealand. A few use "Other licensing (check with source agency)" or have no
licence metadata. The adapter returns `licenseId`, `licenseTitle`, `licenseUrl`,
`rights`, `author` and `organization` so a caller can check the position and
attribution before reuse. For rows where `license_url` is null and `rights` is
present, `rights` is the only licence pointer the source supplies.

### Verification status

- Verified live on 2026-11-07 from this machine with the curl above.
- The MBIE page itself returned the Incapsula challenge to curl, so it was not
  used as the adapter endpoint.
- The unit test uses the committed fixture only. It never hits the network.
- Not verified: behaviour from non-NZ IPs. The catalogue host is the same one
  that data.govt.nz uses, and the existing smoke test skips that host.

## Licences and attribution

The MIT licence in this repo covers the code, not the data. Every source keeps
its own terms, and the publisher's licence is the one that applies.

The table uses source field names when it describes an API response, and the
adapter's camelCase output name when it describes what this library returns.
CKAN and DigitalNZ source fields use snake_case; ArcGIS Hub source fields use
camelCase. For example, CKAN's `license_id` becomes `licenseId`, and DigitalNZ's
`rights_url` becomes `rightsUrl`.

| Adapter | Publisher | Licence position |
| --- | --- | --- |
| `geonet` | GeoNet, a collaboration between NHC Toka Tū Ake and Earth Sciences New Zealand | Creative Commons Attribution 3.0 New Zealand, verified on `geonet.org.nz/about` on 2026-10-08 |
| `data-govt-nz` | data.govt.nz, per dataset | The CKAN API returns `license_id`, `license_title`, `license_url`, `author` and `organization.title` per dataset, and the committed fixture carries both CC-BY-4.0 and CC-BY-NZ-3.0. The adapter returns `licenseId`, `licenseTitle`, `licenseUrl`, `author` and `organization` as the publisher |
| `data-govt-datastore` | data.govt.nz, per resource | The datastore response carries rows, not dataset licence fields. Open the resource page for the dataset licence |
| `mbie-open-data` | Ministry of Business, Innovation and Employment (MBIE), via data.govt.nz | Per dataset. The CKAN response carries `license_id`, `license_title`, `license_url`, `rights`, `author` and `organization.title`, and the adapter returns `licenseId`, `licenseTitle`, `licenseUrl`, `rights`, `author` and `organization`. Most datasets are CC-BY-4.0 or CC-BY-NZ-3.0; a few are "other" or blank. For rows where `license_url` is null and `rights` is present, `rights` is the only licence pointer |
| `ade-search` | Stats NZ, Aotearoa Data Explorer | Check the Stats NZ terms for the table you pull |
| `infoshare` | Stats NZ, Infoshare | Creative Commons Attribution 4.0 International unless the table page says otherwise, verified on `stats.govt.nz/about-us/copyright` on 2026-11-06 |
| `digitalnz` | DigitalNZ (National Library), plus each contributing partner | Each record carries `rights`, `rights_url`, `copyright`, `content_partner`, `publisher`, `creator`, `contributor` and `usage`. Read them before reuse: they range from Creative Commons to all rights reserved. The adapter returns `rights`, `rightsUrl`, `copyright`, `publisher`, `creator`, `contributor` and `usage`, plus `contentPartner` as attribution. When `display_content_partner` is empty, `contentPartner` falls back to `content_partner`, then `publisher` |
| `trademe` | Trade Me | Check the Trade Me API terms of use |
| `nzor` | NZOR, the New Zealand Organisms Register | Creative Commons Attribution-NonCommercial-ShareAlike 3.0 New Zealand, verified on `nzor.org.nz/data-quality-and-use` on 2026-10-08. Not for commercial use |
| `linz` | Toitū Te Whenua LINZ Data Service | Per layer. The layer search endpoint returns id, title and url only, so open the layer page for its licence |
| `arcgis` | The portal owner: Auckland Council (default), Wellington City Council, Canterbury Maps, or Waka Kotahi | Per portal and per dataset. Dataset items carry `licenseInfo`, `accessInformation` and `license`, and the adapter returns all three |
| `lawa` | LAWA, on behalf of participating regional councils and Crown agencies | Check the LAWA terms of use |
| `mfe` | Ministry for the Environment, on the Koordinates platform | Per layer |
| `lris` | Landcare Research, on the Koordinates platform | Per layer |
| `nzta` | Waka Kotahi NZ Transport Agency | Check the Waka Kotahi terms of use |
| `nzta-open-data` | Waka Kotahi open data hub | Per dataset. The DCAT feed carries a `license` value and the adapter passes it through; the first dataset is CC BY 4.0 and others carry custom terms |

Two things follow from the table. First, `arcgis`, `data-govt-nz`, `digitalnz`,
`mbie-open-data` and `nzta-open-data` return the licence, rights or attribution
metadata their source supplies. The other eleven adapters still need a
per-source decision, because most publish terms of use instead of per-record
metadata; a caller who needs to republish a dataset from one of them has to
check the publisher. Those sources are the narrowed open item in `COUNTRY.md`.
Second, NZOR is the one source here that rules out commercial use, so treat
results from it accordingly.

When you republish, credit the publisher, not this library. The connectors
fetch and shape the data; they add nothing to it.
