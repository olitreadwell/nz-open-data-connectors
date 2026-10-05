# NZ Open Data Connectors

TypeScript connectors for New Zealand public data, in `packages/nz-sources`,
with an HTTP API and a CLI on top. Python and Ruby ports live in `python/`
and `ruby/`.

Every adapter works without an API key. DigitalNZ and LINZ accept an optional
key from the environment to unlock more. Keys stay server-side.

## Adapters

| Source | Adapter id | Status |
| --- | --- | --- |
| GeoNet (GNS Science) | `geonet` | Live, keyless |
| data.govt.nz catalogue | `data-govt-nz` | Keyless; fixture-verified (the CDN blocks non-NZ IPs, so the live smoke run skips it) |
| data.govt.nz datastore (MSD benefits) | `data-govt-datastore` | Keyless; fixture-verified (same CDN blocks non-NZ IPs) |
| Aotearoa Data Explorer search | `ade-search` | Live, keyless |
| DigitalNZ (National Library) | `digitalnz` | Live, keyless; optional `DIGITAL_NZ_API_KEY` |
| Trade Me categories | `trademe` | Live, keyless |
| NZ Organisms Register | `nzor` | Upstream retired; committed fixture kept (TLS handshake has failed since 2026-09-21) |
| LINZ Data Service | `linz` | Live, keyless; optional `LINZ_API_KEY` |
| ArcGIS Hub open data | `arcgis` | Live, keyless |
| LAWA river quality sites | `lawa` | Keyless; fixture-verified (live smoke run skips it) |
| MfE Data Service | `mfe` | Live, keyless |
| LRIS land and soil layers | `lris` | Live, keyless |
| Waka Kotahi holiday hotspots | `nzta` | Live, keyless |
| Waka Kotahi open data hub | `nzta-open-data` | Live, keyless; DCAT 1.1 catalogue fixture captured 2026-10-05 |

## Notes

- Adapters live in `packages/nz-sources`. Each one has a live fetch, a strict
  parse, and a committed fixture so builds work offline.
- Fixtures are real snapshots, dated in their filenames.
- The API and CLI read the same registry, so a new adapter shows up in both
  once it is registered.
- See `docs/ARCHITECTURE.md` for the design, and
  `docs/CONNECTOR_DISCOVERY.md` for what has been checked live.
