# @nz-open-data-connectors/nz-sources

Uniform TypeScript adapters for 14 New Zealand public data sources. Node.js and TypeScript users call them directly.

## What this package does

- Gives every adapter the same shape: a live fetch, a strict parse, and a committed fixture fallback.
- Ships 14 adapters. Every one works without an API key.
- Accepts an optional key for DigitalNZ and LINZ.
- Runs its tests offline against real fixture snapshots.

## Install

```sh
npm install @nz-open-data-connectors/nz-sources
```

## Quick start

```ts
import { NZ_DATA_SOURCES, probeAllNzDataSources } from '@nz-open-data-connectors/nz-sources';

for (const source of NZ_DATA_SOURCES) {
  console.log(source.id, source.name, source.auth);
}

const probes = await probeAllNzDataSources({});
for (const probe of probes) {
  console.log(probe.id, probe.ok ? 'ok' : probe.status);
}
```

## Adapters

| id | Source | Auth | What it does |
| --- | --- | --- | --- |
| `geonet` | GeoNet (GNS Science) | none | Recent felt earthquakes. |
| `data-govt-nz` | data.govt.nz catalogue | none | Dataset search. |
| `data-govt-datastore` | data.govt.nz datastore | none | Row pulls, defaulting to national MSD benefit data. |
| `ade-search` | Aotearoa Data Explorer (ADE) search index | none | Table ID and title search. |
| `digitalnz` | DigitalNZ (National Library) | none | Record and media search. |
| `trademe` | Trade Me | none | The public category tree. |
| `nzor` | New Zealand Organisms Register (NZOR) | none | Organism name search. |
| `linz` | LINZ Data Service | none | Layer search for property titles, parcels, and boundaries. |
| `arcgis` | ArcGIS Hub portals | none | Collection list and dataset search. |
| `lawa` | Land, Air, Water Aotearoa (LAWA) | none | River quality monitoring sites. |
| `mfe` | Ministry for the Environment (MfE) Data Service | none | Layer search for water, land, and climate data. |
| `lris` | Landcare Research LRIS | none | Layer search for soil, land cover, and ecosystems. |
| `nzta` | Waka Kotahi journeys API | none | Predicted busy holiday journey hotspots. |
| `nzta-open-data` | Waka Kotahi open data hub | none | The hub's DCAT 1.1 catalogue. |

## Notes and limits

- Every adapter works keyless. DigitalNZ and LINZ accept an optional key: `DIGITAL_NZ_API_KEY` and `LINZ_API_KEY`. Keys are read from the environment only.
- Each adapter falls back to a committed fixture when the upstream API fails or times out. A result can be stale.
- The data.govt.nz catalogue and datastore block non-NZ IP addresses at the CDN. The live smoke tests skip them.
- The NZOR hosts have failed the TLS handshake since 2026-09-21. The adapter stays for its committed fixture.
- Fixtures in `src/fixtures/` are real API snapshots, dated in their filenames.
- Unit tests run offline. Run them with `npm run test -w @nz-open-data-connectors/nz-sources`. Live smoke tests need `RUN_SMOKE=1`.

## Data sources and licences

Each adapter reads one publisher. The table lists the source URL.

| id | Source URL |
| --- | --- |
| `geonet` | `https://api.geonet.org.nz/quake` |
| `data-govt-nz` | `https://catalogue.data.govt.nz/api/3/action/package_search` |
| `data-govt-datastore` | `https://catalogue.data.govt.nz/api/3/action/datastore_search` |
| `ade-search` | `https://explore.data.stats.govt.nz/sfs/api/search` |
| `digitalnz` | `https://api.digitalnz.org/v3/records.json` |
| `trademe` | `https://api.trademe.co.nz/v1/Categories.json` |
| `nzor` | `https://data.nzor.org.nz/names` |
| `linz` | `https://data.linz.govt.nz/services/api/v1/layers` |
| `arcgis` | `https://data-aucklandcouncil.opendata.arcgis.com/api/search/v1/collections` |
| `lawa` | `https://www.lawa.org.nz/umbraco/api/mapservice/RiverQualitySites` |
| `mfe` | `https://data.mfe.govt.nz/services/api/v1/layers` |
| `lris` | `https://lris.scinfo.org.nz/services/api/v1/layers` |
| `nzta` | `https://www.journeys.nzta.govt.nz/api/hotspots` |
| `nzta-open-data` | `https://opendata-nzta.opendata.arcgis.com/api/feed/dcat-us/1.1.json` |

The data is not covered by the package licence. Each publisher sets the licence for its own data. The Waka Kotahi DCAT feed sets Creative Commons Attribution 4.0 (CC BY 4.0) for its first dataset. Some other datasets carry custom NZTA CC-BY 4.0 or non-commercial terms. This was checked on 2026-10-05. Check the source page before you reuse any dataset.

## Package licence

MIT. See LICENSE.

## Links

- npm: https://www.npmjs.com/package/@nz-open-data-connectors/nz-sources
- source: https://github.com/olitreadwell/nz-open-data-connectors/tree/main/packages/nz-sources
- docs: https://github.com/olitreadwell/nz-open-data-connectors/blob/main/docs/CONNECTOR_DISCOVERY.md
