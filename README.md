# NZ Open Data Connectors

Connectors for New Zealand public data. A connector is a small program that
calls one public data source and returns a clean, predictable shape. Think of
it as a travel plug adapter. The source keeps its own socket shape, and you get
one plug that fits your side.

The core is TypeScript. Thin wrappers let you call it from Python, R, Julia,
curl or any other language.

## Keyless first

Every connector works without an API key. An optional key unlocks more data.
Keys stay on the server. The code reads them from the environment and never
sends them over the API or commits them to the repo.

## Packages

| Package | What it is |
| ------- | ---------- |
| [`@nz-open-data-connectors/nz-sources`](https://www.npmjs.com/package/@nz-open-data-connectors/nz-sources) | One adapter per source, with a live probe and an offline fixture |
| [`@nz-open-data-connectors/stats-nz`](https://www.npmjs.com/package/@nz-open-data-connectors/stats-nz) | Client for the Aotearoa Data Explorer (ADE) API: catalogue, data pulls, codelists and CSV parsing |
| [`@nz-open-data-connectors/nz-mcp`](https://www.npmjs.com/package/@nz-open-data-connectors/nz-mcp) | MCP server that exposes the connectors to Claude, ChatGPT and other MCP clients |
| `@nz-open-data-connectors/connectors-api` | Private. HTTP wrapper with an OpenAPI spec and Swagger UI, so any language can call the connectors over HTTP |
| [`@nz-open-data-connectors/connectors-cli`](https://www.npmjs.com/package/@nz-open-data-connectors/connectors-cli) | Command line tool that prints JSON or CSV to stdout, so any language can shell out to it |
| `@nz-open-data-connectors/config-eslint` | Private. Shared ESLint flat config for the TypeScript packages |
| `@nz-open-data-connectors/config-typescript` | Private. Shared TypeScript configuration for the packages |
| `python/` | Python port of the connectors, one dependency (`httpx`). Not on PyPI yet, so install it from the repo. |
| `ruby/` | Ruby port of the connectors, one dependency (`rexml`). Not on RubyGems yet, so install it from the repo. |

## Connectors

The source adapters live in `@nz-open-data-connectors/nz-sources`. Every one
works keyless. DigitalNZ and LINZ accept an optional key from the environment:
`DIGITAL_NZ_API_KEY` and `LINZ_API_KEY`.

## Licences

The data is not ours. Each publisher keeps its own terms. The short version:

- **GeoNet**: copyright Earth Sciences New Zealand, formerly GNS Science.
  Licence: Creative Commons Attribution 3.0 New Zealand.
- **Stats NZ**, including Infoshare: Creative Commons Attribution 4.0
  International, unless a page says otherwise.
- **NZOR**: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 New
  Zealand. This one is not for commercial use.
- **data.govt.nz, MBIE open data, Waka Kotahi, Canterbury Maps, Wellington
  City, Christchurch City, Auckland Transport and Whanganui GeoNode**: each
  dataset carries its own licence value. Read the value on the dataset page.
- **DigitalNZ**, including New Zealand Gazette notices: records carry `rights`,
  `rights_url`, `copyright`, `publisher`, `creator`, `contributor` and `usage`
  values.
- **Environment Canterbury open data**: Creative Commons Attribution 4.0
  International unless a dataset says otherwise. Attribute Environment
  Canterbury as the source.
- **ArcGIS Hub**: datasets carry `licenseInfo`, `accessInformation` and
  `license` values.
- **Auckland Museum**: records carry `copyright` and `dc_contributor` values.
  The adapter returns only the first `copyright` value, so check the record page
  for the full rights and credit.

For every other source, check the publisher's licence before you reuse the
data. The connectors fetch data. They do not relicense it.
`docs/CONNECTOR_DISCOVERY.md` lists where each source's terms live.

## Field names

Source field names follow the source API. CKAN, DigitalNZ and GeoNode use
snake_case. ArcGIS Hub uses camelCase (`licenseInfo`). Adapter output names use
camelCase, so `license_id` becomes `licenseId` and `rights_url` becomes
`rightsUrl`.

The `arcgis`, `auckland-transport-open-data`, `canterbury-maps`,
`christchurch-open-data`, `data-govt-nz`, `digitalnz`, `mbie-open-data`,
`nz-gazette`, `nzta-open-data`, `wellington-city-open-data` and
`whanganui-geospatial` adapters pass the source values through. That includes
attribution fields where the source supplies them.

## Network behaviour

Every adapter sends the same `User-Agent`
(`nz-open-data-connectors (Language=TypeScript)`). It waits at most 30 seconds
for a response. It marks rate-limited (HTTP 429), server-error (HTTP 5xx) and
network failures as `retryable` on the thrown `NzSourceApiError`.

The shared `httpGet` and `httpPost` helpers in
`packages/nz-sources/src/http.ts` do this for every adapter, so callers write
nothing extra.


| id | Source | Keyless? | Key env var | Example command |
| --- | --- | --- | --- | --- |
| `geonet` | GeoNet (Earth Sciences New Zealand) | Yes | - | `npx tsx packages/cli/src/cli.ts probe geonet` |
| `geonet-felt-rapid` | GeoNet felt rapid reports | Yes | - | `npx tsx packages/cli/src/cli.ts probe geonet-felt-rapid` |
| `data-govt-nz` | data.govt.nz catalogue | Yes | - | `npx tsx packages/cli/src/cli.ts probe data-govt-nz` |
| `data-govt-datastore` | data.govt.nz datastore (MSD benefits) | Yes | - | `npx tsx packages/cli/src/cli.ts probe data-govt-datastore` |
| `ade-search` | Aotearoa Data Explorer search index | Yes | - | `npx tsx packages/cli/src/cli.ts probe ade-search` |
| `infoshare` | Stats NZ Infoshare table catalogue | Yes | - | `npx tsx packages/cli/src/cli.ts probe infoshare` |
| `digitalnz` | DigitalNZ (National Library) | Yes | `DIGITAL_NZ_API_KEY` | `npx tsx packages/cli/src/cli.ts probe digitalnz` |
| `nz-gazette` | New Zealand Gazette through DigitalNZ | Yes | - | `npx tsx packages/cli/src/cli.ts probe nz-gazette` |
| `trademe` | Trade Me categories | Yes | - | `npx tsx packages/cli/src/cli.ts probe trademe` |
| `nzor` | NZ Organisms Register | Yes | - | `npx tsx packages/cli/src/cli.ts probe nzor` |
| `linz` | LINZ Data Service catalogue | Yes | `LINZ_API_KEY` | `npx tsx packages/cli/src/cli.ts probe linz` |
| `arcgis` | ArcGIS Hub open data (Auckland, Wellington, Canterbury, NZTA) | Yes | - | `npx tsx packages/cli/src/cli.ts probe arcgis` |
| `auckland-museum` | Auckland Museum collections online | Yes | - | `npx tsx packages/cli/src/cli.ts probe auckland-museum` |
| `lawa` | LAWA river quality monitoring sites | Yes | - | `npx tsx packages/cli/src/cli.ts probe lawa` |
| `charities-register` | Charities Register (DIA) | Yes | - | `npx tsx packages/cli/src/cli.ts probe charities-register` |
| `mfe` | MfE Data Service layer catalogue | Yes | - | `npx tsx packages/cli/src/cli.ts probe mfe` |
| `lris` | LRIS land and soil layer search (Landcare Research) | Yes | - | `npx tsx packages/cli/src/cli.ts probe lris` |
| `mbie-open-data` | MBIE datasets in the national catalogue | Yes | - | `npx tsx packages/cli/src/cli.ts probe mbie-open-data` |
| `nzta` | Waka Kotahi holiday journey hotspots | Yes | - | `npx tsx packages/cli/src/cli.ts probe nzta` |
| `nzta-open-data` | Waka Kotahi open data hub (DCAT 1.1) | Yes | - | `npx tsx packages/cli/src/cli.ts probe nzta-open-data` |
| `lris-basemaps` | LRIS topographic basemaps (OGC WMS) | Yes | - | `npx tsx packages/cli/src/cli.ts probe lris-basemaps` |
| `niwa-rec` | NIWA River Environment Classification (OGC WMS) | Yes | - | `npx tsx packages/cli/src/cli.ts probe niwa-rec` |
| `stats-nz-geographic` | Stats NZ Geographic Data Service | Yes | - | `npx tsx packages/cli/src/cli.ts probe stats-nz-geographic` |
| `whanganui-geospatial` | Whanganui District Council GeoNode | Yes | - | `npx tsx packages/cli/src/cli.ts probe whanganui-geospatial` |
| `christchurch-open-data` | Christchurch City open data hub (DCAT 1.1) | Yes | - | `npx tsx packages/cli/src/cli.ts probe christchurch-open-data` |
| `auckland-transport-open-data` | Auckland Transport open GIS data (DCAT 1.1) | Yes | - | `npx tsx packages/cli/src/cli.ts probe auckland-transport-open-data` |
| `canterbury-maps` | Canterbury Maps open data hub (DCAT 1.1) | Yes | - | `npx tsx packages/cli/src/cli.ts probe canterbury-maps` |
| `wellington-city-open-data` | Wellington City open data hub (DCAT 1.1) | Yes | - | `npx tsx packages/cli/src/cli.ts probe wellington-city-open-data` |
| `environment-canterbury-open-data` | Environment Canterbury open data portal | Yes | - | `npx tsx packages/cli/src/cli.ts probe environment-canterbury-open-data` |
| `electricity-authority` | Electricity Authority downloadable datasets | Yes | - | `npx tsx packages/cli/src/cli.ts probe electricity-authority` |
| `ev-roam` | EV Roam charging stations (NZTA) | Yes | - | `npx tsx packages/cli/src/cli.ts probe ev-roam` |
| `nzpam-geodata` | NZPAM Geodata Catalogue public ArcGIS services | Yes | - | `npx tsx packages/cli/src/cli.ts probe nzpam-geodata` |

### Added 2026-10-05

One more keyless adapter, checked live on 2026-10-05 and covered by a committed
fixture:

- `nzta-open-data` reads the Waka Kotahi (NZTA) open data hub catalogue from
  its DCAT 1.1 feed, with publisher, contact, themes, and a per-dataset
  `license` value.

The exact curl command and the licence notes are in
`docs/CONNECTOR_DISCOVERY.md`.

### Added 2026-11-06

`infoshare` searches the Stats NZ Infoshare table catalogue. Infoshare is an
ASP.NET application, so the adapter opens the search page, posts the query, and
reads the first results page. Each result carries the table title, folder path,
and last-updated date. The live probe searches for "employment".

The session flow and licence note are in `docs/CONNECTOR_DISCOVERY.md`.

### Added 2026-11-07

`mbie-open-data` reads the Ministry of Business, Innovation and Employment
datasets in the data.govt.nz catalogue. Each result carries its notes,
downloadable resources, a licence value or rights link, and the source `author`
and `organization` attribution. The MBIE open data page sits behind a browser
challenge, so the adapter uses the national CKAN catalogue filtered to the MBIE
organisation.

The exact curl command and the licence notes are in
`docs/CONNECTOR_DISCOVERY.md`.

### Added 2026-11-08

Six more keyless adapters were checked live on 2026-11-08. They cover two OGC
WMS services, two ArcGIS Hub DCAT catalogues, the Stats NZ Geographic Data
Service (Koordinates), and the Whanganui District Council GeoNode catalogue.
Each keeps a committed fixture captured from the live response.

A second batch on 2026-11-08 added four more keyless adapters:

- Canterbury Maps DCAT 1.1 catalogue.
- Wellington City DCAT 1.1 catalogue.
- Electricity Authority public dataset container listing.
- NZPAM public ArcGIS REST service folder.

Each keeps a committed fixture captured from the live response.

The exact curl commands, response shapes and licence notes are in
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
# Infoshare - tables matching "employment"
npx tsx packages/cli/src/cli.ts probe infoshare
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
# MBIE - datasets in the national open data catalogue
npx tsx packages/cli/src/cli.ts probe mbie-open-data
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

Both ports mirror part of the TypeScript surface. They carry a subset of the
adapters, the same Stats NZ client, the same fixture-based tests, and opt-in
live smoke tests. The adapters the ports do not carry yet are `arcgis`, `auckland-museum`,
`auckland-transport-open-data`, `canterbury-maps`, `charities-register`,
`christchurch-open-data`, `electricity-authority`, `ev-roam`,
`geonet-felt-rapid`, `infoshare`, `lawa`, `lris`, `lris-basemaps`,
`mbie-open-data`, `mfe`, `niwa-rec`, `nz-gazette`, `nzpam-geodata`, `nzta`,
`nzta-open-data`, `stats-nz-geographic`, `wellington-city-open-data` and
`whanganui-geospatial`.
Each port
has its own quality gates (`ruff` + `mypy` + coverage for Python, `rubocop` +
coverage for Ruby) enforced in CI. See each directory's README for quickstarts
and publishing steps.

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
