# @nz-open-data-connectors/nz-sources

Uniform TypeScript adapters for New Zealand public data sources. Node.js and TypeScript users call them directly.

## What this package does

- Gives every adapter the same shape: a live fetch, a strict parse, and a committed fixture for tests.
- Ships one adapter per supported source. Every one works without an API key.
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
| `infoshare` | Stats NZ Infoshare | none | Table search with folder path and last-updated date. |
| `digitalnz` | DigitalNZ (National Library) | none | Record and media search. |
| `trademe` | Trade Me | none | The public category tree. |
| `nzor` | New Zealand Organisms Register (NZOR) | none | Organism name search. |
| `linz` | LINZ Data Service | none | Layer search for property titles, parcels, and boundaries. |
| `arcgis` | ArcGIS Hub portals | none | Collection list and dataset search. |
| `lawa` | Land, Air, Water Aotearoa (LAWA) | none | River quality monitoring sites. |
| `mfe` | Ministry for the Environment (MfE) Data Service | none | Layer search for water, land, and climate data. |
| `lris` | Landcare Research LRIS | none | Layer search for soil, land cover, and ecosystems. |
| `mbie-open-data` | Ministry of Business, Innovation and Employment (MBIE) | none | MBIE datasets and downloadable files in the national catalogue. |
| `nzta` | Waka Kotahi journeys API | none | Predicted busy holiday journey hotspots. |
| `nzta-open-data` | Waka Kotahi open data hub | none | The hub's DCAT 1.1 catalogue. |
| `lris-basemaps` | LRIS topographic basemaps | none | Named basemap layers from the LRIS OGC WMS. |
| `niwa-rec` | NIWA River Environment Classification | none | REC river network layers from the NIWA OGC WMS. |
| `stats-nz-geographic` | Stats NZ Geographic Data Service | none | Layer search on datafinder. |
| `whanganui-geospatial` | Whanganui District Council GeoNode | none | Municipal geospatial datasets with licence metadata. |
| `christchurch-open-data` | Christchurch City open data hub | none | The hub's DCAT 1.1 catalogue. |
| `auckland-transport-open-data` | Auckland Transport open GIS data | none | The hub's DCAT 1.1 catalogue. |
| `canterbury-maps` | Canterbury Maps open data hub | none | The hub's DCAT 1.1 catalogue. |
| `wellington-city-open-data` | Wellington City open data hub | none | The hub's DCAT 1.1 catalogue. |
| `electricity-authority` | Electricity Authority downloadable datasets | none | First page of the public Azure Blob container listing. |
| `nzpam-geodata` | NZPAM Geodata Catalogue | none | Public ArcGIS REST services for petroleum and minerals geodata. |

## Notes and limits

- Every adapter works keyless. DigitalNZ and LINZ accept an optional key: `DIGITAL_NZ_API_KEY` and `LINZ_API_KEY`. Keys are read from the environment only.
- A live fetch throws when the upstream API fails or times out. Fixtures are read only through `loadFixture`, so a stale snapshot never appears silently.
- The data.govt.nz catalogue and datastore block non-NZ IP addresses at the CDN. The MBIE adapter uses the same catalogue host, so the live smoke tests skip all three.
- The NZOR hosts have failed the TLS handshake since 2026-09-21. The adapter stays for its committed fixture.
- Infoshare returns the first 20 table matches per search. The adapter does not follow its ASP.NET pagination, so use the total count to decide whether to narrow the query.
- The WMS adapters return service metadata and named layers. They do not request map tiles.
- Whanganui GeoNode returns the first page of datasets and reports the catalogue total. The adapter does not follow its pagination.
- Whanganui GeoNode falls back to HTTP/1.1 when Node's built-in fetch closes the HTTP/2 stream. The shared `httpGet` timeout and error mapping still apply.
- Canterbury Maps and Wellington City read DCAT 1.1 feeds. Three Wellington City dataset titles arrive as JSON numbers, and the shared DCAT parser normalizes them to strings.
- Electricity Authority returns the first page of its public Azure Blob container listing, with `nextMarker` for the next page. The live response carried 3,941 objects.
- NZPAM Geodata reads the public ArcGIS REST folder. The live response listed 13 services; the Utilities and Internal folders return `Token Required` and are not requested.
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
| `infoshare` | `https://infoshare.stats.govt.nz/SearchPage.aspx` |
| `digitalnz` | `https://api.digitalnz.org/v3/records.json` |
| `trademe` | `https://api.trademe.co.nz/v1/Categories.json` |
| `nzor` | `https://data.nzor.org.nz/names` |
| `linz` | `https://data.linz.govt.nz/services/api/v1/layers` |
| `arcgis` | `https://data-aucklandcouncil.opendata.arcgis.com/api/search/v1/collections` |
| `lawa` | `https://www.lawa.org.nz/umbraco/api/mapservice/RiverQualitySites` |
| `mfe` | `https://data.mfe.govt.nz/services/api/v1/layers` |
| `lris` | `https://lris.scinfo.org.nz/services/api/v1/layers` |
| `mbie-open-data` | `https://catalogue.data.govt.nz/api/3/action/package_search?fq=organization:ministry-of-business-innovation-and-employment` |
| `nzta` | `https://www.journeys.nzta.govt.nz/api/hotspots` |
| `nzta-open-data` | `https://opendata-nzta.opendata.arcgis.com/api/feed/dcat-us/1.1.json` |
| `lris-basemaps` | `https://maps.scinfo.org.nz/basemaps/wms?service=WMS&request=GetCapabilities` |
| `niwa-rec` | `https://geoserver.niwa.co.nz/rec/wms?service=WMS&request=GetCapabilities` |
| `stats-nz-geographic` | `https://datafinder.stats.govt.nz/services/api/v1/layers` |
| `whanganui-geospatial` | `https://geonode.whanganui.govt.nz/api/v2/datasets/?page_size=100` |
| `christchurch-open-data` | `https://opendata-christchurchcity.hub.arcgis.com/api/feed/dcat-us/1.1.json` |
| `auckland-transport-open-data` | `https://data-atgis.opendata.arcgis.com/api/feed/dcat-us/1.1.json` |
| `canterbury-maps` | `https://opendata.canterburymaps.govt.nz/api/feed/dcat-us/1.1.json` |
| `wellington-city-open-data` | `https://data-wcc.opendata.arcgis.com/api/feed/dcat-us/1.1.json` |
| `electricity-authority` | `https://emidatasets.blob.core.windows.net/publicdata?restype=container&comp=list` |
| `nzpam-geodata` | `https://gis.nzpam.govt.nz/server/rest/services/Public?f=pjson` |

The data is not covered by the package licence. Each publisher sets the licence for its own data. Stats NZ content, including Infoshare and the Geographic Data Service, is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0) unless a page says otherwise. The `arcgis`, `auckland-transport-open-data`, `canterbury-maps`, `christchurch-open-data`, `data-govt-nz`, `digitalnz`, `mbie-open-data`, `nzta-open-data`, `wellington-city-open-data` and `whanganui-geospatial` adapters return the source-supplied licence or rights metadata: `licenseInfo`, `accessInformation` and `license` for ArcGIS Hub datasets; `license` for the Canterbury Maps, Wellington City, Christchurch City and Auckland Transport DCAT feeds; `licenseId`, `licenseTitle`, `licenseUrl`, `author` and `organization` for data.govt.nz; `rights`, `rightsUrl`, `copyright`, `publisher`, `contentPartner`, `creator`, `contributor` and `usage` for DigitalNZ records; `licenseId`, `licenseTitle`, `licenseUrl`, `author`, `organization` and `rights` for MBIE; `license` for the Waka Kotahi DCAT feed; and `licenseIdentifier` for Whanganui GeoNode datasets. Source field names follow the API: CKAN, DigitalNZ and GeoNode use snake_case, and ArcGIS Hub uses camelCase. Adapter output names use camelCase. Most MBIE datasets carry CC BY 4.0 or CC BY-NZ 3.0; some carry other or no licence metadata. The Waka Kotahi, Canterbury Maps, Wellington City, Christchurch City and Auckland Transport DCAT feeds carry a licence value per dataset; the values vary, so check each one. The Electricity Authority copyright statement licenses its material for reuse under CC BY 4.0 unless an item says otherwise; the dataset listing itself has no licence field. The NZPAM ArcGIS REST response has no licence field; check the publisher's terms. The LRIS basemaps and NIWA REC WMS services declare `Fees: none` and their own access constraints; check the publisher's terms. These terms were checked on 2026-11-08. Check the source page before you reuse any dataset.

## Package licence

MIT. See LICENSE.

## Links

- npm: https://www.npmjs.com/package/@nz-open-data-connectors/nz-sources
- source: https://github.com/olitreadwell/nz-open-data-connectors/tree/main/packages/nz-sources
- docs: https://github.com/olitreadwell/nz-open-data-connectors/blob/main/docs/CONNECTOR_DISCOVERY.md
