# NZ Open Data Connectors

TypeScript connectors for New Zealand public data, with language-agnostic wrappers so you can use them from any language (Python, R, Julia, curl, whatever you like).

Keyless-first: every connector works without an API key. Optional keys unlock more, and keys stay server-side - they are read from the environment and never exposed over the API or committed to the repo.

## Packages

| Package | What it is |
| ------- | ---------- |
| `@nzlab/nz-sources` | Uniform adapters for 8 NZ data sources (GeoNet, data.govt.nz, LINZ, DigitalNZ, Trade Me, NZOR, ADE search, MSB benefits datastore) with live probes and offline fixtures |
| `@nzlab/stats-nz` | Client for the Aotearoa Data Explorer (ADE) API: dataflow catalogue, data pulls, codelists, CSV parsing and serialization |
| `@nzlab/connectors-api` | HTTP wrapper with an OpenAPI spec and Swagger UI, so any language can call the connectors over HTTP |
| `@nzlab/connectors-cli` | `nzdata` command line tool that prints JSON or CSV to stdout, so any language can shell out to it |

## Language-agnostic access

### HTTP API

```sh
npm install
npm run dev:api        # http://localhost:8787
```

- `GET /health` - health check
- `GET /openapi.json` - machine-readable OpenAPI spec (generate clients in any language from this)
- `GET /docs` - Swagger UI
- `GET /api/sources` - list every adapter
- `GET /api/sources/:id/probe` - live probe one source
- `GET /api/stats-nz/catalogue` - every ADE dataflow
- `GET /api/stats-nz/data?dataflowId=AGR_AGR_003` - data rows as JSON
- `GET /api/stats-nz/data?dataflowId=AGR_AGR_003&format=csv` - data rows as CSV
- `GET /api/stats-nz/codelist?codelistId=CL_LIVESTOCK_AGR_AGR_003` - dimension codes to labels (needs a key)

```sh
curl 'http://localhost:8787/api/stats-nz/data?dataflowId=AGR_AGR_003'
```

### CLI

```sh
npx tsx packages/cli/src/cli.ts sources
npx tsx packages/cli/src/cli.ts probe linz
npx tsx packages/cli/src/cli.ts catalogue
npx tsx packages/cli/src/cli.ts data --dataflow AGR_AGR_003 --format csv
npx tsx packages/cli/src/cli.ts codelist --codelist CL_LIVESTOCK_AGR_AGR_003
```

Output goes to stdout as JSON (or CSV), errors go to stderr, and the exit code is 0 on success.

## Quick start (TypeScript)

```sh
npm install
cp .env.example .env   # optional keys, see below
npm run check
```

```ts
import { probeAllNzDataSources } from '@nzlab/nz-sources';
import { createStatsNzClient } from '@nzlab/stats-nz';

const probes = await probeAllNzDataSources({});
console.log(probes.map((p) => `${p.id}: ${p.ok ? 'ok' : p.status}`).join('\n'));

const client = createStatsNzClient({});
const dataflows = await client.getDataflowCatalogue();
console.log(dataflows.length); // 911
```

## Environment variables

| Variable | Needed for | Where to get it |
| -------- | ---------- | --------------- |
| `STATS_NZ_SUBSCRIPTION_KEY` | Stats NZ codelists and non-agriculture tables | Free signup at portal.apis.stats.govt.nz |
| `LINZ_API_KEY` | LINZ layer search (optional) | data.linz.govt.nz |
| `DIGITAL_NZ_API_KEY` | DigitalNZ search (optional) | digitalnz.org |

Copy `.env.example` to `.env` and fill in your own keys. Real keys are gitignored and never committed.

## Testing

```sh
npm run check          # lint + type-check + unit tests (fixtures only, no network)
npm run test:smoke     # live smoke tests against the real APIs (needs keys in env)
```

Unit tests use committed fixture snapshots pulled from the live APIs, so they run offline. Smoke tests are opt-in via `RUN_SMOKE=1` and hit the real endpoints.

## License

MIT
