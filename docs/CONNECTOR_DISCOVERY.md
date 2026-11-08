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

## 2026-11-08 addition: six keyless adapters

Six more keyless adapters were built and probed against the live services on
2026-11-08. They are the LRIS topographic basemaps WMS, the NIWA River
Environment Classification WMS, the Stats NZ Geographic Data Service, the
Whanganui District Council GeoNode catalogue, and the Christchurch City and
Auckland Transport ArcGIS Hub DCAT catalogues.

| Adapter | Source | Endpoint | Fixture |
| --- | --- | --- | --- |
| `lris-basemaps` | LRIS, Landcare Research | `https://maps.scinfo.org.nz/basemaps/wms?service=WMS&request=GetCapabilities` | `lris-basemaps-wms-2026-11-08.xml` |
| `niwa-rec` | NIWA | `https://geoserver.niwa.co.nz/rec/wms?service=WMS&request=GetCapabilities` | `niwa-rec-wms-2026-11-08.xml` |
| `stats-nz-geographic` | Stats NZ Geographic Data Service | `https://datafinder.stats.govt.nz/services/api/v1/layers?search=meshblock` | `stats-nz-geographic-meshblock-2026-11-08.json` |
| `whanganui-geospatial` | Whanganui District Council | `https://geonode.whanganui.govt.nz/api/v2/datasets/?page_size=100` | `whanganui-geonode-datasets-2026-11-08.json` |
| `christchurch-open-data` | Christchurch City Council | `https://opendata-christchurchcity.hub.arcgis.com/api/feed/dcat-us/1.1.json` | `christchurch-open-data-2026-11-08.json` |
| `auckland-transport-open-data` | Auckland Transport | `https://data-atgis.opendata.arcgis.com/api/feed/dcat-us/1.1.json` | `auckland-transport-open-data-2026-11-08.json` |

### Exact curl commands

```sh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

# LRIS topographic basemaps WMS capabilities
curl -sS -L -A "$UA" \
  "https://maps.scinfo.org.nz/basemaps/wms?service=WMS&request=GetCapabilities" \
  -o lris-basemaps-wms-2026-11-08.xml

# NIWA River Environment Classification WMS capabilities
curl -sS -L -A "$UA" \
  "https://geoserver.niwa.co.nz/rec/wms?service=WMS&request=GetCapabilities" \
  -o niwa-rec-wms-2026-11-08.xml

# Stats NZ Geographic Data Service layer search
curl -sS -L -A "$UA" \
  "https://datafinder.stats.govt.nz/services/api/v1/layers?search=meshblock" \
  -o stats-nz-geographic-meshblock-2026-11-08.json

# Whanganui District Council GeoNode dataset list
curl -sS -L -A "$UA" \
  "https://geonode.whanganui.govt.nz/api/v2/datasets/?page_size=100" \
  -o whanganui-geonode-datasets-2026-11-08.json

# Christchurch City open data DCAT 1.1 catalogue
curl -sS -L -A "$UA" \
  "https://opendata-christchurchcity.hub.arcgis.com/api/feed/dcat-us/1.1.json" \
  -o christchurch-open-data-2026-11-08.json

# Auckland Transport open GIS DCAT 1.1 catalogue
curl -sS -L -A "$UA" \
  "https://data-atgis.opendata.arcgis.com/api/feed/dcat-us/1.1.json" \
  -o auckland-transport-open-data-2026-11-08.json
```

### Live response evidence

The same requests returned these responses from an Auckland connection on
2026-11-08. Each body was saved as the committed fixture.

| Adapter | HTTP status | Content type | Bytes |
| --- | --- | --- | --- |
| `lris-basemaps` | 200 | `text/xml; charset=UTF-8` | 23905 |
| `niwa-rec` | 200 | `text/xml` | 224131 |
| `stats-nz-geographic` | 200 | `application/json` | 63777 |
| `whanganui-geospatial` | 200 | `application/json` | 1155925 |
| `christchurch-open-data` | 200 | `application/json; charset=utf-8` | 1580589 |
| `auckland-transport-open-data` | 200 | `application/json; charset=utf-8` | 136115 |

### Shape notes

- The two WMS adapters read a WMS 1.3.0 `GetCapabilities` document. They return
  the service title and abstract plus a flat list of named layers. Each layer
  carries its title, abstract, `queryable` flag, declared CRS list, and
  `EX_GeographicBoundingBox`. CRS codes and bounds are not inherited from a
  parent layer.
- `lris-basemaps` returns 12 named layers. The first is `ext_basemap`, titled
  "Landcare Research NZ Topographic Baselayer".
- `niwa-rec` returns one named layer, `rivers`, titled "REC2 River network".
  Its capabilities document has no service title or abstract.
- `stats-nz-geographic` reads the Koordinates layer search API used by
  datafinder. The response is a JSON array. The adapter keeps the layer id,
  title, url, type, first and latest publication dates, featured date, services
  url, public access level, capabilities, and permissions. The default live
  probe searches for "meshblock" and returns 100 layers.
- `whanganui-geospatial` reads GeoNode API v2. The response is one page with
  `total`, `page`, `page_size`, and `datasets`. The adapter requests 100 rows,
  reports the catalogue total (257), and keeps each dataset's key, name, title,
  abstract, subtype, date, last updated date, detail and download urls,
  workspace, licence identifier, extent, and owner username and email.
- `christchurch-open-data` and `auckland-transport-open-data` read DCAT 1.1
  catalogues. They share the strict parser introduced for `nzta-open-data`.
  The feeds carry 478 and 45 datasets. Each dataset keeps identifier, title,
  description, landing page, keywords, issued and modified dates, publisher,
  contact, licence, themes, spatial value, and distributions. `theme` arrives
  as a list or a string, and the parser normalizes both to a string list.

### Licence

- `lris-basemaps`: the WMS `Service` block declares `Fees: none` and an empty
  `AccessConstraints` value. Check the LRIS terms before reuse.
- `niwa-rec`: the WMS `Service` block declares `Fees: none` and
  `AccessConstraints: none`. Check the NIWA terms before reuse.
- `stats-nz-geographic`: Stats NZ content is Creative Commons Attribution 4.0
  International unless the layer page says otherwise.
- `whanganui-geospatial`: each dataset carries a `license.identifier`. On the
  captured first page, most values are `not_specified` or empty. Check the
  dataset page before reuse.
- `christchurch-open-data`: most datasets point at CC BY 4.0. Some carry custom
  council, Landcare, or Sentinel terms, and some have a blank licence value.
  The adapter returns the raw `license` value.
- `auckland-transport-open-data`: 42 of the 45 datasets point at CC BY 4.0.
  Three have a blank licence value. The adapter returns the raw `license`
  value.

### Verification status

- All six curl commands returned HTTP 200 from an Auckland connection on
  2026-11-08. The fixtures are the same response bodies.
- A live probe through the built package returned the following:
  `lris-basemaps` OK, 12 layers, first `ext_basemap`; `niwa-rec` OK, 1 layer,
  first `rivers`; `stats-nz-geographic` OK, 100 layers, first
  "General Electorates 2025"; `whanganui-geospatial` OK, total 257, 100 rows,
  first "Addresses DEPRECATED"; `christchurch-open-data` OK, 478 datasets;
  `auckland-transport-open-data` OK, 45 datasets.
- Node 26's built-in fetch negotiates HTTP/2 with the GeoNode host and the
  stream closes with `NGHTTP2_PROTOCOL_ERROR`. The host answers HTTP/1.1
  normally, so `whanganui-geospatial` tries the default fetch first and falls
  back to an HTTP/1.1 fetch implementation through the shared `httpGet`
  helper when the transport fails. The adapter probe succeeded after that
  change. This is recorded because the same host may need the same treatment
  in another runtime.
- The unit tests use the committed fixtures only. They never hit the network.
- Not verified: behaviour from non-NZ IPs, or whether the licence values are
  stable over time.

## 2026-11-08 addition: four keyless adapters (batch 2)

Four more keyless adapters were built and probed against the live services on
2026-11-08. They are the Canterbury Maps and Wellington City DCAT 1.1 feeds,
the Electricity Authority public dataset container listing, and the NZPAM
public ArcGIS REST services folder. The generic `arcgis` adapter also accepts
the Canterbury and Wellington ArcGIS Hub hosts; these dedicated adapters use
the richer DCAT feed.

| Adapter | Source | Endpoint | Fixture |
| --- | --- | --- | --- |
| `canterbury-maps` | Canterbury Maps | `https://opendata.canterburymaps.govt.nz/api/feed/dcat-us/1.1.json` | `canterbury-maps-2026-11-08.json` |
| `wellington-city-open-data` | Wellington City Council | `https://data-wcc.opendata.arcgis.com/api/feed/dcat-us/1.1.json` | `wellington-city-open-data-2026-11-08.json` |
| `electricity-authority` | Electricity Authority | `https://emidatasets.blob.core.windows.net/publicdata?restype=container&comp=list` | `electricity-authority-datasets-2026-11-08.xml` |
| `nzpam-geodata` | NZPAM Geodata Catalogue | `https://gis.nzpam.govt.nz/server/rest/services/Public?f=pjson` | `nzpam-geodata-services-2026-11-08.json` |

### Exact curl commands

```sh
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

# Canterbury Maps DCAT 1.1 catalogue
curl -sS -L -A "$UA" \
  "https://opendata.canterburymaps.govt.nz/api/feed/dcat-us/1.1.json" \
  -o canterbury-maps-2026-11-08.json

# Wellington City DCAT 1.1 catalogue
curl -sS -L -A "$UA" \
  "https://data-wcc.opendata.arcgis.com/api/feed/dcat-us/1.1.json" \
  -o wellington-city-open-data-2026-11-08.json

# Electricity Authority public Azure Blob container listing
curl -sS -L -A "$UA" \
  "https://emidatasets.blob.core.windows.net/publicdata?restype=container&comp=list" \
  -o electricity-authority-datasets-2026-11-08.xml

# NZPAM public ArcGIS REST services folder
curl -sS -L -A "$UA" \
  "https://gis.nzpam.govt.nz/server/rest/services/Public?f=pjson" \
  -o nzpam-geodata-services-2026-11-08.json
```

### Live response evidence

The same requests returned these responses from an Auckland connection on
2026-11-08. Each body was saved as the committed fixture.

| Adapter | HTTP status | Content type | Bytes |
| --- | --- | --- | --- |
| `canterbury-maps` | 200 | `application/json; charset=utf-8` | 1917893 |
| `wellington-city-open-data` | 200 | `application/json; charset=utf-8` | 5054548 |
| `electricity-authority` | 200 | `application/xml` | 2624943 |
| `nzpam-geodata` | 200 | `text/plain;charset=UTF-8` | 1096 |

### Shape notes

- `canterbury-maps` returns 480 datasets. The first is "Effluent Dairy
  Discharge Area (Active) - Consented Activities", published by Canterbury
  Regional Council, with a `license` value of
  `https://creativecommons.org/licenses/by/3.0`. It carries six distributions;
  the second is an ArcGIS GeoServices REST API distribution.
- `wellington-city-open-data` returns 481 datasets. The first is "Heritage
  Trees", published by Wellington City Council, with a `license` value of
  `Creative Commons 3.0 (NZ)`. Three dataset titles arrive as JSON numbers in
  the live feed. The shared DCAT parser normalizes those titles to strings.
- `electricity-authority` returns the first page of an Azure Blob container
  listing. The captured page carries 3,941 objects and a `NextMarker` for the
  next page. Each object carries `Name`, `Url`, `Last-Modified`, `Etag`,
  `Content-Length` and `Content-Type`. Folders appear as zero-byte objects.
- `nzpam-geodata` returns ArcGIS REST version `11.5`, no subfolders in
  `Public`, and 13 services. The first is
  `Public/CMA_Minerals_Excluded_Land` (`MapServer`). The folder also includes
  `FeatureServer` endpoints for `GeodataCatalogue_Layers`,
  `Permits_Minerals_Layers` and `Permits_Petroleum_Layers`. The `Utilities`
  and `Internal` folders return `Token Required` (error 499) and are not used.

### Licence

- `canterbury-maps`: the DCAT feed carries a per-dataset `license` value. The
  first captured dataset points at Creative Commons Attribution 3.0. Check the
  dataset licence before reuse.
- `wellington-city-open-data`: the DCAT feed carries a per-dataset `license`
  value. The first captured dataset says Creative Commons 3.0 (NZ). Check the
  dataset licence before reuse.
- `electricity-authority`: the container listing carries no per-object licence
  field. The Electricity Authority copyright, disclaimer and transparency
  statement says its copyright material is licensed for reuse under CC BY 4.0
  unless indicated otherwise. That statement was checked on 2026-11-08.
- `nzpam-geodata`: the ArcGIS REST response carries no licence field. Check the
  NZPAM terms before reuse.

### Skipped in this pass

| Source | Exact failure |
| --- | --- |
| NIWA DataHub | `https://data.niwa.co.nz/api/3/action/package_search?rows=1` returned HTTP 404 HTML with a canonical `store.niwa.co.nz` URL. `store.niwa.co.nz` did not resolve from this machine. No data API was found. |
| New Zealand Legislation | The developer API documentation says "You need an API key", issued by emailing `contact@pco.govt.nz`. `https://www.legislation.govt.nz/api` returned HTTP 404. Per-document `.xml` files are keyless, but no keyless search or index API was found. |
| Figure.NZ | The list says the old public API has been withdrawn. The homepage and chart pages are HTML. A chart `/download` URL returned HTTP 200 `image/png`, not a data file. No keyless JSON or CSV dataset API was found. |
| Reserve Bank of New Zealand | `https://www.rbnz.govt.nz/statistics` returned HTTP 403 with "Website unavailable". |
| NZPAM CKAN API | `https://geodata.nzpam.govt.nz/api/3/action/package_search?rows=1` returned HTTP 403. The public ArcGIS REST folder was used instead. |

## Licences and attribution

The MIT licence in this repo covers the code, not the data. Every source keeps
its own terms, and the publisher's licence is the one that applies.

The table uses source field names when it describes an API response, and the
adapter's camelCase output name when it describes what this library returns.
CKAN, DigitalNZ and GeoNode source fields use snake_case; ArcGIS Hub source
fields use camelCase. For example, CKAN's `license_id` becomes `licenseId`,
and DigitalNZ's `rights_url` becomes `rightsUrl`.

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
| `lris-basemaps` | Landcare Research, on the LRIS basemaps WMS | The WMS `Service` block declares `Fees: none` and an empty `AccessConstraints` value. Check the LRIS terms |
| `niwa-rec` | NIWA, on the REC WMS | The WMS `Service` block declares `Fees: none` and `AccessConstraints: none`. Check the NIWA terms |
| `stats-nz-geographic` | Stats NZ Geographic Data Service, on the Koordinates platform | Creative Commons Attribution 4.0 International unless the layer page says otherwise |
| `whanganui-geospatial` | Whanganui District Council, on GeoNode | Per dataset. The GeoNode API returns `license.identifier`, and the adapter passes it through as `licenseIdentifier`. Most captured values are `not_specified` or empty |
| `christchurch-open-data` | Christchurch City Council open data hub | Per dataset. The DCAT feed carries a `license` value and the adapter passes it through. Most datasets point at CC BY 4.0; some carry custom council, Landcare, or Sentinel terms, and some are blank |
| `auckland-transport-open-data` | Auckland Transport open GIS data hub | Per dataset. The DCAT feed carries a `license` value and the adapter passes it through. 42 of the 45 captured datasets point at CC BY 4.0; three are blank |
| `canterbury-maps` | Canterbury Maps, Environment Canterbury and partners | Per dataset. The DCAT feed carries a `license` value and the adapter passes it through. The first captured dataset points at Creative Commons Attribution 3.0 |
| `wellington-city-open-data` | Wellington City Council open data hub | Per dataset. The DCAT feed carries a `license` value and the adapter passes it through. The first captured dataset says Creative Commons 3.0 (NZ) |
| `electricity-authority` | Electricity Authority | The container listing has no per-object licence. The Authority's copyright statement says its copyright material is licensed for reuse under CC BY 4.0 unless indicated otherwise, checked 2026-11-08 |
| `nzpam-geodata` | New Zealand Petroleum and Minerals (NZPAM) | The public ArcGIS REST response carries no licence field. Check the NZPAM terms |

Two things follow from the table. First, `arcgis`,
`auckland-transport-open-data`, `canterbury-maps`, `christchurch-open-data`,
`data-govt-nz`, `digitalnz`, `mbie-open-data`, `nzta-open-data`,
`wellington-city-open-data` and `whanganui-geospatial` return the licence,
rights or attribution metadata their source supplies. The other sixteen
adapters still need a per-source decision, because most publish terms of use
instead of per-record metadata; a caller who needs to republish a dataset from
one of them has to check the publisher. Those sources are the narrowed open
item in `COUNTRY.md`. Second, NZOR is the one source here that rules out
commercial use, so treat results from it accordingly.

When you republish, credit the publisher, not this library. The connectors
fetch and shape the data; they add nothing to it.
