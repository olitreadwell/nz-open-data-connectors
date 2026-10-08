# NZ Open Data Connectors

TypeScript connectors for New Zealand public data, with language-agnostic wrappers so you can use them from any language (Python, R, Julia, curl, whatever you like).

Keyless-first: every connector works without an API key. Optional keys unlock more, and keys stay server-side - they are read from the environment and never exposed over the API or committed to the repo.

## Packages

| Package | What it is |
| ------- | ---------- |
| [`@nz-open-data-connectors/nz-sources`](https://www.npmjs.com/package/@nz-open-data-connectors/nz-sources) | Uniform adapters for 14 NZ public data sources, with live probes and offline fixtures |
| [`@nz-open-data-connectors/stats-nz`](https://www.npmjs.com/package/@nz-open-data-connectors/stats-nz) | Client for the Aotearoa Data Explorer (ADE) API: dataflow catalogue, data pulls, codelists, and CSV parsing |
| [`@nz-open-data-connectors/nz-mcp`](https://www.npmjs.com/package/@nz-open-data-connectors/nz-mcp) | MCP server that exposes the connectors to Claude, ChatGPT, and other MCP clients |
| `@nz-open-data-connectors/connectors-api` | Private. HTTP wrapper with an OpenAPI spec and Swagger UI, so any language can call the connectors over HTTP |
| [`@nz-open-data-connectors/connectors-cli`](https://www.npmjs.com/package/@nz-open-data-connectors/connectors-cli) | Command line tool that prints JSON or CSV to stdout, so any language can shell out to it |
| `@nz-open-data-connectors/config-eslint` | Private. Shared ESLint flat config for the TypeScript packages |
| `@nz-open-data-connectors/config-typescript` | Private. Shared TypeScript configuration for the packages |
| `python/` | Python port of the connectors, one dependency (`httpx`). Not on PyPI yet; install from the repo. |
| `ruby/` | Ruby port of the connectors, one dependency (`rexml`). Not on RubyGems yet; install from the repo. |

## Connectors

Fourteen source adapters, all in `@nz-open-data-connectors/nz-sources`. Every one works
keyless. Two accept an optional key from the environment to unlock more:
DigitalNZ with `DIGITAL_NZ_API_KEY` and LINZ with `LINZ_API_KEY`.

The data is not ours, and each publisher keeps its own terms. GeoNet content
is copyright Earth Sciences New Zealand (formerly GNS Science) and carries
Creative Commons Attribution 3.0 New Zealand. NZOR content carries Creative
Commons Attribution-NonCommercial-ShareAlike 3.0 New Zealand, so it is not for
commercial use. data.govt.nz and the Waka Kotahi open data hub return a licence
value per dataset, and the `nzta-open-data` adapter passes that value through.
For every other source, check the publisher's licence before you reuse the data:
the connectors fetch it, they do not relicense it. `docs/CONNECTOR_DISCOVERY.md`
lists where each source's terms live.

Every adapter also sends the same `User-Agent`
(`nz-open-data-connectors/0.1.0 (Language=TypeScript)`), waits at most 30
seconds for a response, and marks rate-limited (HTTP 429), server-error (HTTP
5xx) and network failures as `retryable` on the thrown `NzSourceApiError`. The
shared `httpGet` helper in `packages/nz-sources/src/http.ts` does this for all
fourteen adapters, so callers write nothing extra.

| id | Source | Keyless? | Key env var | Example command |
| --- | --- | --- | --- | --- |
| `geonet` | GeoNet (Earth Sciences New Zealand) | Yes | - | `npx tsx packages/cli/src/cli.ts probe geonet` |
| `data-govt-nz` | data.govt.nz catalogue | Yes | - | `npx tsx packages/cli/src/cli.ts probe data-govt-nz` |
| `data-govt-datastore` | data.govt.nz datastore (MSD benefits) | Yes | - | `npx tsx packages/cli/src/cli.ts probe data-govt-datastore` |
| `ade-search` | Aotearoa Data Explorer search index | Yes | - | `npx tsx packages/cli/src/cli.ts probe ade-search` |
| `digitalnz` | DigitalNZ (National Library) | Yes | `DIGITAL_NZ_API_KEY` | `npx tsx packages/cli/src/cli.ts probe digitalnz` |
| `trademe` | Trade Me categories | Yes | - | `npx tsx packages/cli/src/cli.ts probe trademe` |
| `nzor` | NZ Organisms Register | Yes | - | `npx tsx packages/cli/src/cli.ts probe nzor` |
| `linz` | LINZ Data Service catalogue | Yes | `LINZ_API_KEY` | `npx tsx packages/cli/src/cli.ts probe linz` |
| `arcgis` | ArcGIS Hub open data (Auckland, Wellington, Canterbury, NZTA) | Yes | - | `npx tsx packages/cli/src/cli.ts probe arcgis` |
| `lawa` | LAWA river quality monitoring sites | Yes | - | `npx tsx packages/cli/src/cli.ts probe lawa` |
| `mfe` | MfE Data Service layer catalogue | Yes | - | `npx tsx packages/cli/src/cli.ts probe mfe` |
| `lris` | LRIS land and soil layer search (Landcare Research) | Yes | - | `npx tsx packages/cli/src/cli.ts probe lris` |
| `nzta` | Waka Kotahi holiday journey hotspots | Yes | - | `npx tsx packages/cli/src/cli.ts probe nzta` |
| `nzta-open-data` | Waka Kotahi open data hub (DCAT 1.1) | Yes | - | `npx tsx packages/cli/src/cli.ts probe nzta-open-data` |

### Added 2026-10-05

One more keyless adapter, checked live on 2026-10-05 and covered by a committed
fixture:

- `nzta-open-data` reads the Waka Kotahi (NZTA) open data hub catalogue from
  its DCAT 1.1 feed: 36 datasets, each with publisher, contact, themes, and a
  per-dataset `license` value.

The exact curl command and the licence notes are in
`docs/CONNECTOR_DISCOVERY.md`.

### Adapter examples

Each probe prints a JSON summary with the probe `id`, `name`, `auth`, an
`ok` or `status` line, and a `sample` of the live data.

```sh
# GeoNet - recent felt earthquakes (magnitude 3+)
npx tsx packages/cli/src/cli.ts probe geonet
```

```sh
# data.govt.nz - datasets matching "sheep" from the national catalogue
npx tsx packages/cli/src/cli.ts probe data-govt-nz
```

```sh
# data.govt.nz datastore - national MSD benefit rows
npx tsx packages/cli/src/cli.ts probe data-govt-datastore
```

```sh
# ADE search - tables matching "median annual earnings"
npx tsx packages/cli/src/cli.ts probe ade-search
```

```sh
# DigitalNZ - digitised records matching "sheep"
npx tsx packages/cli/src/cli.ts probe digitalnz
```

```sh
# Trade Me - the public category tree
npx tsx packages/cli/src/cli.ts probe trademe
```

```sh
# NZOR - organism names matching "kiwi"
npx tsx packages/cli/src/cli.ts probe nzor
```

```sh
# LINZ - layers matching "property" (property titles, parcels, boundaries)
npx tsx packages/cli/src/cli.ts probe linz
```

```sh
# ArcGIS Hub - open data collections from Auckland Council (default host)
npx tsx packages/cli/src/cli.ts probe arcgis
```

```sh
# LAWA - river quality monitoring sites across New Zealand
npx tsx packages/cli/src/cli.ts probe lawa
```

```sh
# MfE Data Service - layers matching "water" from the Ministry for the Environment
npx tsx packages/cli/src/cli.ts probe mfe
```

```sh
# LRIS - land and soil layers matching "soil" from Landcare Research
npx tsx packages/cli/src/cli.ts probe lris
```

```sh
# Waka Kotahi - predicted busy holiday journey hotspots
npx tsx packages/cli/src/cli.ts probe nzta
```

```sh
# Waka Kotahi - open data hub catalogue (DCAT 1.1 feed)
npx tsx packages/cli/src/cli.ts probe nzta-open-data
```

## Language-agnostic access

### HTTP API

```sh
npm install
npm run dev:api        # http://localhost:8787
```

- `GET /health` - health check
- `GET /metrics` - request counts in Prometheus format
- `GET /openapi.json` - machine-readable OpenAPI spec (generate clients in any language from this)
- `GET /docs` - Swagger UI
- `GET /api/sources` - list every adapter
- `GET /api/sources/:id/probe` - live probe one source
- `GET /api/digitalnz/media?q=kiwi&type=images` - DigitalNZ media search (images, newspapers, videos, audio, literature, artwork)
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
npx tsx packages/cli/src/cli.ts media --query kiwi --type images
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
import { probeAllNzDataSources } from '@nz-open-data-connectors/nz-sources';
import { createStatsNzClient } from '@nz-open-data-connectors/stats-nz';

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
| `SENTRY_DSN` | Error tracking (optional, off by default) | sentry.io |
| `PORT` | Port the API listens on (default 8787) | your own deployment |
| `CORS_ORIGIN` | Restricting browser access to `/api` (default: any origin) | your own deployment |
| `RATE_LIMIT_MAX` | Per-IP request budget for `/api` (default: 60 per minute) | your own deployment |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (default: 60000) | your own deployment |

Copy `.env.example` to `.env` and fill in your own keys. Real keys are gitignored and never committed.

## Testing

```sh
npm run check          # lint + type-check + unit tests (fixtures only, no network)
npm run test:smoke     # live smoke tests against the real APIs (needs keys in env)
```

Unit tests use committed fixture snapshots pulled from the live APIs, so they run offline. Smoke tests are opt-in via `RUN_SMOKE=1` and hit the real endpoints.

## Language ports

`python/` and `ruby/` are ports of the same design. Neither is published to
PyPI or RubyGems yet, so install from the repo. The publish workflows exist and
fire on `python-v*` and `ruby-v*` tags when a maintainer cuts a release.

Both ports mirror part of the TypeScript surface: 8 of the 14 adapters, the same
Stats NZ client, the same fixture-based tests, and opt-in live smoke tests. The
six adapters the ports do not carry yet are `arcgis`, `lawa`, `mfe`, `lris`,
`nzta` and `nzta-open-data`. Each port has its own quality gates (`ruff` +
`mypy` + coverage for Python, `rubocop` + coverage for Ruby) enforced in CI. See
each directory's README for quickstarts and publishing steps.

## Run the API in Docker

The `Dockerfile` at the repo root runs the HTTP API on port `8787` with a non-root user and a health check.

```sh
docker build -t nz-connectors .
docker run -p 8787:8787 --env-file .env nz-connectors
```

Optional keys come from the environment only. Without a `.env` file every keyless endpoint still works.

## Documentation

- `docs/ARCHITECTURE.md` - how the pieces fit together, in plain language
- `docs/CONNECTOR_DISCOVERY.md` - every adapter, the live check behind it, the sources that did not work, and the licence position per source
- `docs/SECURITY.md` - key handling and the security checklist
- `docs/GLOSSARY.md` - plain-language definitions of every term
- `docs/RELEASING.md` - how versions, tags, and publishing work
- `docs/AGENT_CONTEXT.md` - handoff context for an agent working in this repo
- `docs/faq.md` - keys, licences, fixtures, and how to add a source
- `docs/contact.md` - how to report a bug, a dead source, or a security problem
- `COUNTRY.md` - adapter status table and the sources that are not wired up

The other files under `docs/` come from the shared project template
(`olitreadwell/template`) and describe the template's own gates. For this repo,
the API contract lives at `GET /openapi.json` and `/docs`.

## Contributing

See `CONTRIBUTING.md` for how to set up the repo, run the checks, and
open a pull request.

## License

MIT
