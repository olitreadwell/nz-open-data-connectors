# NZ Open Data Connectors

TypeScript connectors for New Zealand public data, in `packages/nz-sources`,
with an HTTP API and a CLI on top. Python and Ruby ports live in `python/`
and `ruby/`.

Every adapter works without an API key. DigitalNZ and LINZ accept an optional
key from the environment to unlock more. Keys stay server-side.

## Adapters

All fourteen were probed keyless from an Auckland connection on 2026-10-08,
and all fourteen answered. Fixture dates are the capture dates.

| Source | Adapter id | Status |
| --- | --- | --- |
| GeoNet (Earth Sciences New Zealand) | `geonet` | Live, keyless |
| data.govt.nz catalogue | `data-govt-nz` | Live, keyless |
| data.govt.nz datastore (MSD benefits) | `data-govt-datastore` | Live, keyless |
| Aotearoa Data Explorer search | `ade-search` | Live, keyless |
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

A key that is set but blank is treated as unset. An empty `LINZ_API_KEY` or
`DIGITAL_NZ_API_KEY` is trimmed away at the boundary, so the request goes out
keyless instead of sending `api_key=` and collecting a 403 from DigitalNZ.

## Checklist

- [x] Fourteen keyless adapters, each with a live fetch, a strict parse, and a
      committed fixture
- [x] Shared HTTP layer (`httpGet`): one User-Agent, 30 second timeout,
      `retryable` on 429, 5xx and network failures
- [x] HTTP API with an OpenAPI spec, Swagger UI, and a contract test
- [x] CLI that prints JSON or CSV
- [x] Dockerfile with a non-root user and a health check
- [x] Python and Ruby ports for 8 of the 14 adapters
- [ ] Publish the ports to PyPI and RubyGems
- [ ] Port the remaining six adapters (`arcgis`, `lawa`, `mfe`, `lris`,
      `nzta`, `nzta-open-data`)
- [ ] Return licence and attribution metadata per record, instead of only for
      `nzta-open-data`
- [ ] Keyed adapters: NZBN / Companies Office, NIWA, RBNZ, Koordinates,
      Auckland Transport

## Not wired up

Checked during the 2026-08-25 discovery pass and not retried since. See
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

See `docs/ARCHITECTURE.md` for the design and
`docs/CONNECTOR_DISCOVERY.md` for what has been checked live.
