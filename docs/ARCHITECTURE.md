# Architecture

Plain-language map of this repo. If you are new here, start with
`README.md`, then read this file.

## What this repo is

One design, three languages.

- TypeScript: the source of truth. Adapters, Stats NZ client, HTTP API, CLI.
- Python: a port of the same design (`python/`, package name `nzdata`).
- Ruby: a port of the same design (`ruby/`, gem name `nzdata`).

The ports carry 8 of the 14 TypeScript adapters, plus the same Stats NZ client.
The other six adapters (`arcgis`, `lawa`, `mfe`, `lris`, `nzta`,
`nzta-open-data`) are TypeScript only. Porting them is separate work, so a new
adapter lands in TypeScript first and in the ports only when someone ports it.

## The pieces

| Piece | Location | What it does |
| ----- | -------- | ------------ |
| Source adapters | `packages/nz-sources` | One adapter per NZ public data source |
| Stats NZ client | `packages/stats-nz` | Reads the Aotearoa Data Explorer (ADE) API |
| HTTP API | `packages/api` | Exposes the connectors over HTTP |
| CLI | `packages/cli` | Exposes the connectors on the command line |
| Config packages | `packages/config-eslint`, `packages/config-typescript` | Shared lint and TypeScript settings |
| Python port | `python/` | 8 of the 14 adapters and the Stats NZ client, in Python |
| Ruby port | `ruby/` | 8 of the 14 adapters and the Stats NZ client, in Ruby |

## How a request flows

Every adapter speaks one interface (`NzDataAdapter`). It knows how to:
1. describe itself (`id`, `name`, `auth`, `description`)
2. fetch live data
3. parse the response into plain objects

The HTTP API and the CLI call the same adapters. They never call the
endpoints directly. This is what "one design" means.

Live fetches go through the shared helper in
`packages/nz-sources/src/http.ts`. It sets one `User-Agent`
(`nz-open-data-connectors/0.1.0 (Language=TypeScript)`), aborts after 30
seconds, and marks HTTP 429, HTTP 5xx and network failures as `retryable` on
the thrown `NzSourceApiError`, with the HTTP status attached. Adapters pass
their own headers (LINZ sends `x-api-key`, Waka Kotahi sends
`Accept: application/json`) and the helper merges them.

## Media search

The DigitalNZ adapter also answers media searches: images, newspaper
articles, videos, audio, literature (books), and artwork. Each media type
maps to a DigitalNZ category filter, and records carry preview image URLs
where the source supplies them. Artwork shares the Images category because
DigitalNZ has no separate artwork category.

The CLI exposes it as `nzdata media --query <q> --type <type>` and the API
as `GET /api/digitalnz/media?q=<q>&type=<type>`. The same function exists
in the Python and Ruby ports (`search_digital_nz_media`).

## Summaries built into the adapters

One adapter answers with a summary next to the raw rows, so callers do not have
to recompute the same figures:

- `summarizeGeoNetQuakes` gives the quake count, the strongest quake, the
  shallowest quake, and a count per magnitude band (3-4, 4-5, 5+).

The Python and Ruby ports carry the same summary, also named
`summarize_geonet_quakes`.

## Keyless first

Every source works without an API key. Keys unlock more:
- Stats NZ subscription key unlocks codelists and non-agriculture tables
- LINZ key unlocks layer search
- DigitalNZ key raises the rate limit

Keys are read from the environment only. The API and CLI never accept keys
from callers, and keys are never committed to the repo.

## Fixtures instead of the live network

Tests never touch the network unless you set `RUN_SMOKE=1`.

Each adapter has committed fixtures in `src/fixtures/`. A fixture is a real
snapshot of a live API response. Filenames include the date they were
captured, for example `agricultural-livestock-regional-council-2025-08-17.csv`.

Why: tests run fast, offline, and give the same answer on every machine.

## Testing strategy

| Kind | Where | When it runs |
| --- | --- | --- |
| Unit tests | `src/*.test.ts` next to each source file | `npm run check` |
| Integration tests | `packages/api/src/app.test.ts` | `npm run check` |
| E2E tests | `packages/api/src/e2e.test.ts` | `npm run check` |
| Live smoke tests | `*.test.ts` gated on `RUN_SMOKE=1` | opt-in, or nightly CI |
| Contract test | `packages/api/src/openapi.contract.test.ts` | `npm run check` |

The Python and Ruby ports mirror this: fixture-based tests plus opt-in
smoke tests.

## Where quality gates live

- Coverage threshold 60% per package: `vitest.config.ts` (TypeScript),
  `pyproject.toml` (Python), `spec_helper.rb` (Ruby)
- Lint: ESLint (TypeScript), `ruff` (Python), `rubocop` (Ruby)
- Type check: `tsc` (TypeScript), `mypy` (Python)
- CI: `.github/workflows/ci.yml`, `.github/workflows/smoke.yml`

## Documentation index

- `README.md` - quickstart and commands
- `docs/ARCHITECTURE.md` - this file
- `docs/CONNECTOR_DISCOVERY.md` - what has been checked live, and the licence position per source
- `docs/SECURITY.md` - keys, audits, and the security checklist
- `docs/GLOSSARY.md` - plain-language terms
- `docs/RELEASING.md` - how versions and tags work
- `docs/AGENT_CONTEXT.md` - handoff context for an agent working in this repo
- `COUNTRY.md` - adapter status and what is not wired up
