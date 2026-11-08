# NZ Open Data Connectors

TypeScript connectors for New Zealand public data, in `packages/nz-sources`,
with an HTTP API and a CLI on top. Python and Ruby ports live in `python/`
and `ruby/`.

Every adapter works without an API key. DigitalNZ and LINZ accept an optional
key from the environment to unlock more. Keys stay server-side.

## Adapters

All twenty-six were probed keyless from an Auckland connection. The first
fourteen were checked on 2026-10-08, Infoshare on 2026-11-06, MBIE open data on
2026-11-07, six more on 2026-11-08, and four more on 2026-11-08; all answered.
Fixture dates are the capture dates.

| Source | Adapter id | Status |
| --- | --- | --- |
| GeoNet (Earth Sciences New Zealand) | `geonet` | Live, keyless |
| data.govt.nz catalogue | `data-govt-nz` | Live, keyless |
| data.govt.nz datastore (MSD benefits) | `data-govt-datastore` | Live, keyless |
| MBIE open data | `mbie-open-data` | Live, keyless; MBIE datasets in the national catalogue |
| Aotearoa Data Explorer search | `ade-search` | Live, keyless |
| Stats NZ Infoshare | `infoshare` | Live, keyless; HTML table search |
| DigitalNZ (National Library) | `digitalnz` | Live, keyless; optional `DIGITAL_NZ_API_KEY` raises the rate limit |
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
| Whanganui District Council GeoNode | `whanganui-geospatial` | Live, keyless; first 100 datasets |
| Christchurch City open data | `christchurch-open-data` | Live, keyless; DCAT 1.1 catalogue |
| Auckland Transport open GIS data | `auckland-transport-open-data` | Live, keyless; DCAT 1.1 catalogue |
| Canterbury Maps open data | `canterbury-maps` | Live, keyless; DCAT 1.1 catalogue, 480 datasets |
| Wellington City open data | `wellington-city-open-data` | Live, keyless; DCAT 1.1 catalogue, 481 datasets |
| Electricity Authority datasets | `electricity-authority` | Live, keyless; first page of the public Azure Blob container listing |
| NZPAM Geodata Catalogue | `nzpam-geodata` | Live, keyless; 13 public ArcGIS REST services |

A key that is set but blank is treated as unset. An empty `LINZ_API_KEY` or
`DIGITAL_NZ_API_KEY` is trimmed away at the boundary, so the request goes out
keyless instead of sending `api_key=` and collecting a 403 from DigitalNZ.

## Checklist

- [x] Twenty-six keyless adapters, each with a live fetch, a strict parse, and a
      committed fixture
- [x] Shared HTTP layer (`httpGet`, `httpPost`): one User-Agent, 30 second timeout,
      `retryable` on 429, 5xx and network failures
- [x] HTTP API with an OpenAPI spec, Swagger UI, and a contract test
- [x] CLI that prints JSON or CSV
- [x] Dockerfile with a non-root user and a health check
- [x] Python and Ruby ports for 8 of the 26 adapters
- [ ] Publish the ports to PyPI and RubyGems
- [ ] Port the remaining eighteen adapters (`arcgis`,
      `auckland-transport-open-data`, `canterbury-maps`, `christchurch-open-data`,
      `electricity-authority`, `infoshare`, `lawa`, `lris`, `lris-basemaps`,
      `mbie-open-data`, `mfe`, `niwa-rec`, `nzpam-geodata`, `nzta`,
      `nzta-open-data`, `stats-nz-geographic`, `wellington-city-open-data`,
      `whanganui-geospatial`)
- [x] Return source-supplied licence and attribution metadata per record:
      `arcgis`, `auckland-transport-open-data`, `canterbury-maps`,
      `christchurch-open-data`, `data-govt-nz`, `digitalnz`, `mbie-open-data`,
      `nzta-open-data`, `wellington-city-open-data` and
      `whanganui-geospatial`
- [ ] Add licence and attribution metadata to the other sixteen adapters:
      `ade-search`, `data-govt-datastore`, `electricity-authority`, `geonet`,
      `infoshare`, `lawa`, `linz`, `lris`, `lris-basemaps`, `mfe`, `niwa-rec`,
      `nzpam-geodata`, `nzor`, `stats-nz-geographic`, `nzta` and `trademe`.
      Most publish terms of use instead of a per-record licence, so each source
      needs its own decision
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
| Regional council hubs (Horizons, ECan, Waikato, HBRC, Environment Southland, Marlborough, West Coast) | blocked: 403, timeouts, or bad certificates |
| Former council hub hosts (Auckland Council, BOPRC, NRC, GDC, TRC, Tasman) | DNS does not resolve |
| MetService | no keyless JSON endpoint found |
| NIWA `api.niwa.co.nz` | needs a key |
| NIWA DataHub | CKAN paths return 404; the canonical shop host does not resolve |
| New Zealand Legislation API | needs an API key from the Parliamentary Counsel Office |

See `docs/ARCHITECTURE.md` for the design and
`docs/CONNECTOR_DISCOVERY.md` for what has been checked live.
