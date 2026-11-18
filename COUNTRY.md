# NZ Open Data Connectors

TypeScript connectors for New Zealand public data, in `packages/nz-sources`,
with an HTTP API and a CLI on top. Python and Ruby ports live in `python/`
and `ruby/`.

Every adapter works without an API key. DigitalNZ and LINZ accept an optional
key from the environment to unlock more. Keys stay server-side.

## Adapters

All thirty-two were probed keyless from an Auckland connection. Fourteen were
checked on 2026-10-08, Infoshare on 2026-11-06, MBIE open data on 2026-11-07,
ten more on 2026-11-08, five more on 2026-11-16, and Environment Canterbury on
2026-11-18; all answered. Fixture
dates are the capture dates.

| Source | Adapter id | Status |
| --- | --- | --- |
| GeoNet (Earth Sciences New Zealand) | `geonet` | Live, keyless |
| GeoNet felt rapid reports | `geonet-felt-rapid` | Live, keyless; latest reported shaking points and MMI totals |
| data.govt.nz catalogue | `data-govt-nz` | Live, keyless |
| data.govt.nz datastore (MSD benefits) | `data-govt-datastore` | Live, keyless |
| MBIE open data | `mbie-open-data` | Live, keyless; MBIE datasets in the national catalogue |
| Aotearoa Data Explorer search | `ade-search` | Live, keyless |
| Stats NZ Infoshare | `infoshare` | Live, keyless; HTML table search |
| DigitalNZ (National Library) | `digitalnz` | Live, keyless; optional `DIGITAL_NZ_API_KEY` raises the rate limit |
| New Zealand Gazette | `nz-gazette` | Live, keyless; DigitalNZ collection, newest first |
| Trade Me categories | `trademe` | Live, keyless |
| NZ Organisms Register | `nzor` | Live, keyless; licence is CC BY-NC-SA 3.0 NZ, so not for commercial use |
| LINZ Data Service | `linz` | Live, keyless; optional `LINZ_API_KEY` |
| ArcGIS Hub open data | `arcgis` | Live, keyless; Auckland Council is the default host |
| LAWA river quality sites | `lawa` | Live, keyless |
| MfE Data Service | `mfe` | Live, keyless |
| LRIS land and soil layers | `lris` | Live, keyless |
| Waka Kotahi holiday hotspots | `nzta` | Live, keyless; sends `Accept: application/json` |
| Waka Kotahi open data hub | `nzta-open-data` | Live, keyless; DCAT 1.1 catalogue, fixture captured 2026-10-05 |
| LRIS topographic basemaps | `lris-basemaps` | Live, keyless; OGC WMS capabilities |
| NIWA River Environment Classification | `niwa-rec` | Live, keyless; OGC WMS capabilities |
| Stats NZ Geographic Data Service | `stats-nz-geographic` | Live, keyless; layer search on datafinder |
| Whanganui District Council GeoNode | `whanganui-geospatial` | Live, keyless; first page of datasets |
| Christchurch City open data | `christchurch-open-data` | Live, keyless; DCAT 1.1 catalogue |
| Auckland Transport open GIS data | `auckland-transport-open-data` | Live, keyless; DCAT 1.1 catalogue |
| Canterbury Maps open data | `canterbury-maps` | Live, keyless; DCAT 1.1 catalogue |
| Wellington City open data | `wellington-city-open-data` | Live, keyless; DCAT 1.1 catalogue |
| Environment Canterbury open data | `environment-canterbury-open-data` | Live, keyless; first catalogue page, with the full total |
| Electricity Authority datasets | `electricity-authority` | Live, keyless; first page of the public Azure Blob container listing |
| NZPAM Geodata Catalogue | `nzpam-geodata` | Live, keyless; 13 public ArcGIS REST services |
| Auckland Museum collections | `auckland-museum` | Live, keyless; Elasticsearch collection search |
| Charities Register (DIA) | `charities-register` | Live, keyless; OData organisation name search |
| EV Roam charging stations (NZTA) | `ev-roam` | Live, keyless; ArcGIS FeatureServer, 639 stations |

A key that is set but blank is treated as unset. An empty `LINZ_API_KEY` or
`DIGITAL_NZ_API_KEY` is trimmed away at the boundary, so the request goes out
keyless instead of sending `api_key=` and collecting a 403 from DigitalNZ.

## Keyed sources

These catalogue APIs need a key, subscription, or account. They are not in the
public keyless adapter set. The private connector set can add them once the
credentials exist.

| Source | What it needs | Catalogue entry |
| --- | --- | --- |
| DOC Developer Portal | API key or subscription | `https://api.doc.govt.nz/` |
| MSD API Developer Portal | API key or subscription | `https://api.msd.govt.nz/` |
| Te Papa Collections API | Registration | `https://data.tepapa.govt.nz/docs/register.html` |
| ACC Developer Resource Centre | API key or subscription | `https://developer.acc.co.nz/` |
| MBIE business APIs (NZBN, Companies, Insolvency, PPSR, IPONZ, Market Rent) | API key through the MBIE portal | `https://portal.api.business.govt.nz/` |
| Auckland Transport API | Subscription key | `https://api.at.govt.nz/` |
| Inland Revenue developer guides | Account or key | `https://www.ird.govt.nz/digital-service-providers/guides-and-docs` |
| RealMe Developer | Integration account | `https://developers.realme.govt.nz/how-realme-works` |

## Checklist

- [x] Keyless adapters, each with a live fetch, a strict parse, and a
      committed fixture
- [x] Shared HTTP layer (`httpGet`, `httpPost`): one User-Agent, 30 second timeout,
      `retryable` on 429, 5xx and network failures
- [x] HTTP API with an OpenAPI spec, Swagger UI, and a contract test
- [x] CLI that prints JSON or CSV
- [x] Dockerfile with a non-root user and a health check
- [x] Python and Ruby ports for part of the adapter set
- [ ] Publish the ports to PyPI and RubyGems
- [ ] Port the remaining adapters (`arcgis`, `auckland-museum`,
      `auckland-transport-open-data`, `canterbury-maps`, `charities-register`,
      `christchurch-open-data`, `electricity-authority`,
      `environment-canterbury-open-data`, `ev-roam`,
      `geonet-felt-rapid`, `infoshare`, `lawa`, `lris`, `lris-basemaps`,
      `mbie-open-data`, `mfe`, `niwa-rec`, `nz-gazette`, `nzpam-geodata`,
      `nzta`, `nzta-open-data`, `stats-nz-geographic`,
      `wellington-city-open-data`, `whanganui-geospatial`)
- [x] Return source-supplied licence and attribution metadata per record:
      `arcgis`, `auckland-museum`, `auckland-transport-open-data`,
      `canterbury-maps`, `christchurch-open-data`, `data-govt-nz`, `digitalnz`,
      `mbie-open-data`, `nz-gazette`, `nzta-open-data`,
      `wellington-city-open-data` and `whanganui-geospatial`
- [x] Return source-supplied service and page rights metadata where the
      source has no per-record field: `environment-canterbury-open-data`
      (CC BY 4.0 link, licence statement and copyright notice),
      `lris-basemaps` and `niwa-rec` (fees, access constraints and contact
      organisation from the WMS service block)
- [ ] Add adapter-level licence metadata for sources that publish a
      source-wide licence but no licence field in the API payload:
      `charities-register`, `electricity-authority`, `ev-roam`, `geonet`,
      `geonet-felt-rapid`, `infoshare`, `nzor` and `stats-nz-geographic`.
      The licence belongs on the adapter, not each record, because the
      response carries no licence value
- [ ] Decide whether to expose publisher terms for `ade-search`,
      `data-govt-datastore`, `lawa`, `linz`, `lris`, `mfe`, `nzpam-geodata`,
      `nzta` and `trademe`. These publish terms of use or per-item terms, not
      a reusable licence value in the response
- [ ] Keyed adapters: NZBN / Companies Office, NIWA, RBNZ, NZ Legislation,
      Koordinates, Auckland Transport

## Not wired up

Checked during the 2026-08-25 and 2026-11-08 discovery passes. See
`docs/CONNECTOR_DISCOVERY.md` for the endpoints and the exact responses.

| Source | Why not |
| --- | --- |
| educationcounts.govt.nz | 403 to non-browser clients |
| figure.nz | no usable public API found |
| data1850.nz | no API |
| incidents.fireandemergency.nz | dead |
| api.rbnz.govt.nz | 403, needs a key |
| data.doc.govt.nz | dead |
| Regional council hubs (Horizons, Waikato, HBRC, Environment Southland, Marlborough, West Coast) | blocked: 403, timeouts, or bad certificates |
| Former council hub hosts (Auckland Council, BOPRC, NRC, GDC, TRC, Tasman) | DNS does not resolve |
| MetService | no keyless JSON endpoint found |
| NIWA `api.niwa.co.nz` | needs a key |
| NIWA DataHub | CKAN paths return 404; the canonical shop host does not resolve |
| New Zealand Legislation API | needs an API key from the Parliamentary Counsel Office |
| Government consultation listing API | `https://www.govt.nz/api/v2/consultation/list` returns HTTP 500 for public requests; catalogue page still lists it |
| Government A-Z directory API | `https://www.govt.nz/api/v2/organisation/list` returns HTTP 500 for public requests; catalogue page still lists it |
| NZTA driver licence holders | ArcGIS FeatureServer now answers `Token Required`; keep the dataset/CSV route instead |

See `docs/ARCHITECTURE.md` for the design and
`docs/CONNECTOR_DISCOVERY.md` for what has been checked live.
