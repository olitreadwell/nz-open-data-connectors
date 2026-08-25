# Connector discovery notes (2026-08-25)

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
(identical payloads on two consecutive calls). None are registered in
`registry.ts` (out of scope for this pass).

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
