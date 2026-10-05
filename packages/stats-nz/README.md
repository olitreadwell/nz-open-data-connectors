# @nz-open-data-connectors/stats-nz

Client for the Aotearoa Data Explorer (ADE) API from Stats NZ. Server-side TypeScript users pull catalogue, data, and codelists.

## What this package does

- Reads the ADE SDMX 2.1 REST API at `https://api.data.stats.govt.nz/rest/`.
- Pulls the dataflow catalogue, data rows, and codelists.
- Parses and writes CSV.
- Runs on the server only. SDMX responses can be large.

## Install

```sh
npm install @nz-open-data-connectors/stats-nz
```

## Quick start

```ts
import { createStatsNzClient } from '@nz-open-data-connectors/stats-nz';

const client = createStatsNzClient({});
const catalogue = await client.getDataflowCatalogue();
console.log(catalogue.length); // 911

const rows = await client.getData({ dataflowId: 'AGR_AGR_003', format: 'csv' });
console.log(rows.length);
```

## Adapters

| Adapter | What it does | Key |
| --- | --- | --- |
| `createStatsNzClient(options)` | Builds a client. Returns the methods below. | none |
| `client.getDataflowCatalogue()` | Every ADE dataflow, with titles. 911 dataflows at version 1.0. | none |
| `client.getData({ dataflowId, format })` | Data rows for one dataflow. | none for `AGR_*` tables |
| `client.getCodelist(codelistId, options)` | Maps dimension codes to labels. | `STATS_NZ_SUBSCRIPTION_KEY` |
| `serializeStatsNzRowsToCsv(rows)` | Turns typed rows back into CSV. | none |

## Notes and limits

- The old `api.stats.govt.nz` open data API closed on 30 August 2024. ADE replaces it.
- Keyless requests must use an explicit published version. The client defaults to version `1.0`.
- The `csv` format is keyless for agriculture tables only.
- The `csvfilewithlabels` and `jsondata` formats need a subscription key.
- The `jsondata` parser follows the SDMX-JSON 1.0 spec. It is not yet live-verified.
- All failures throw `StatsNzError` subclasses: `StatsNzApiError` for HTTP status, and `StatsNzParseError` for a malformed response. `StatsNzApiError.retryable` is true for 429 and 5xx.
- A free key is available at https://portal.apis.stats.govt.nz. Set `STATS_NZ_SUBSCRIPTION_KEY` in the server environment.
- Access levels in this file were verified live on 2025-08-17.
- Fixtures in `src/fixtures/` are real ADE snapshots, dated in their filenames.
- Unit tests run offline. Run them with `npm run test -w @nz-open-data-connectors/stats-nz`. Live smoke tests need `RUN_SMOKE=1`.

## Data sources and licences

- Publisher: Stats NZ.
- Source URL: `https://api.data.stats.govt.nz/rest/`.
- API guide: https://www.stats.govt.nz/tools/aotearoa-data-explorer/ade-api-user-guide/.
- The data is not covered by the package licence. Stats NZ sets the licence and terms for ADE data. Check the API guide before you reuse a table.

## Package licence

MIT. See LICENSE.

## Links

- npm: https://www.npmjs.com/package/@nz-open-data-connectors/stats-nz
- source: https://github.com/olitreadwell/nz-open-data-connectors/tree/main/packages/stats-nz
- docs: https://github.com/olitreadwell/nz-open-data-connectors/blob/main/docs/ARCHITECTURE.md
