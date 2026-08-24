# @nzlab/stats-nz

Shared client for the [Aotearoa Data Explorer (ADE) API](https://www.stats.govt.nz/tools/aotearoa-data-explorer/ade-api-user-guide/) - the current Stats NZ data API (the old `api.stats.govt.nz` open data API closed 30 August 2024). SDMX 2.1 REST, base URL `https://api.data.stats.govt.nz/rest/`.

Server-side only (SDMX responses can be large; never call this from the browser).

## Quick start

```ts
import { createStatsNzClient } from '@nzlab/stats-nz';

const client = createStatsNzClient({
  subscriptionKey: process.env.STATS_NZ_SUBSCRIPTION_KEY, // optional, see below
});

// Every table in ADE, with titles: 911 dataflows, keyless.
const catalogue = await client.getDataflowCatalogue();

// Data as typed rows. Works keyless for agriculture tables (e.g. AGR_AGR_003).
const rows = await client.getData({ dataflowId: 'AGR_AGR_003', format: 'csv' });
// rows: [{ dimensions: { LIVESTOCK: '6731', AREA: '20', YEAR: '2024' }, value: 23583001, ... }]

// Codelists (dimension code -> label) need a subscription key.
const codelist = await client.getCodelist('CL_LIVESTOCK_AGR_AGR_003', { version: '1.0' });
```

## Access levels (verified live 2025-08-17)

| Endpoint                                   | Without key                  | With key   |
| ------------------------------------------ | ---------------------------- | ---------- |
| `getDataflowCatalogue()`                   | yes                          | yes        |
| `getData({ format: 'csv' })`               | agriculture tables (`AGR_*`) | all tables |
| `getData({ format: 'csvfilewithlabels' })` | no                           | yes        |
| `getData({ format: 'jsondata' })`          | no                           | yes        |
| `getCodelist()` / structure endpoints      | no                           | yes        |

Keyless requests must use the explicit published version. The client defaults to `1.0` (every one of the 911 current dataflows is version 1.0); pass `version: 'latest'` only with a key.

## Subscription key

Free signup at [portal.apis.stats.govt.nz](https://portal.apis.stats.govt.nz). Set `STATS_NZ_SUBSCRIPTION_KEY` in the app env (server-only). Sent as the `Ocp-Apim-Subscription-Key` header; never exposed to the browser.

## Formats

- `csv` - codes only, keyless for `AGR_*` tables. Fast to parse, verified against the real API.
- `csvfilewithlabels` - code + label columns, requires a key.
- `jsondata` - SDMX-JSON, requires a key. Parser implemented against the SDMX-JSON 1.0 spec; **not yet live-verified** (needs a subscription key).

`serializeStatsNzRowsToCsv(rows)` turns typed observations back into CSV (dimension columns, then `value`, then `status` when present) for language-agnostic output.

## Errors

All failures throw `StatsNzError` subclasses: `StatsNzApiError` (HTTP status, `retryable` flag for 429/5xx) and `StatsNzParseError` (malformed response).

## Tests

```sh
npm run test -w @nzlab/stats-nz        # unit + integration (local stub server) + perf + security
RUN_SMOKE=1 npm run test:smoke -w @nzlab/stats-nz   # live smoke tests against api.data.stats.govt.nz
```

Fixtures in `src/fixtures/` are real snapshots pulled from the ADE API (`format=csv` and the dataflow catalogue), dated in their filenames. The smoke tests are skipped by default and must be run explicitly.
