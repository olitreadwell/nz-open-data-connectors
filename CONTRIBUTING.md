# Contributing

Thanks for helping with the NZ Open Data Connectors. This file explains
how to add a new data source (a connector). Plain language. Short
sentences.

## How to add a connector

One connector is one adapter. An adapter talks to one data source and
returns plain objects. Adapters live in `packages/nz-sources/src/`.

Every adapter follows the same pattern. Read
`packages/nz-sources/src/linz.ts` as a reference. An adapter:

- has a unique `id`, a `name`, an `auth` value, and a `description`
- fetches live data with `fetchLive`
- parses the response with `parse` (strict, using Zod)
- loads a committed fixture with `loadFixture`, so tests work offline

Use 2-3 word, domain-prefixed names for exports. For example,
`searchLinzLayers`, not `search`. Add a doc comment above every export.
Every exported function needs an explicit return type. No `any` escape
hatches.

## Fixture policy

Fixtures are real snapshots from the live APIs. Never hand-write a
fixture.

- Capture a real response from the live API and commit it.
- Name the file with the capture date:
  `src/fixtures/<source>-<topic>-<yyyy-mm-dd>.json`.
- For example: `linz-layer-search-2025-08-17.json`.
- Update the fixture when the API response format changes.

Tests never hit the network unless `RUN_SMOKE=1` is set.

## Tests

Test files sit next to their source file. `linz.test.ts` tests `linz.ts`.
Cover the parser with the fixture. Cover the error paths (bad payloads,
HTTP errors). The coverage threshold is 60% per package, enforced by
`npm run check`.

## Registry

Register the adapter in `packages/nz-sources/src/registry.ts`. Add it to
`NZ_DATA_SOURCES`. Export it from `packages/nz-sources/src/index.ts`.
The CLI and the HTTP API pick it up automatically.

## Docs

Update the docs in the same change:

- `README.md` - the "Connectors" table and example blocks
- `docs/ARCHITECTURE.md` - if the shape of the repo changes
- `docs/GLOSSARY.md` - new terms, defined on first use

Write docs in plain language. Short sentences. Define acronyms on first
use. The audience includes ESL readers and neurodivergent readers.

## Three-language parity

The Python and Ruby ports mirror the TypeScript design. A behavior
change to the shared design must land in all three languages:

- `python/` (package `nzdata`)
- `ruby/` (gem `nzdata`)

Each port has its own quality gates:

- Python: `ruff` + `mypy` + pytest
- Ruby: `bundle exec rake check`

## PR conventions

Use Conventional Commits for the subject line:

- `feat:` for a new connector
- `fix:` for a bug fix
- `docs:` for documentation
- `chore:` for tooling

Match the repo's branch pattern (`<type>/<description>`). See
`AGENTS.md` for details.

## How to run checks

```sh
npm run check       # format + lint + type-check + tests with coverage
npm run audit       # dependency audit
npm run test:smoke  # live tests against real APIs (needs RUN_SMOKE=1)
cd python && .venv/bin/ruff check src tests && .venv/bin/mypy && .venv/bin/pytest
cd ruby && bundle exec rake check
```

Run `npm run check` before finishing any TypeScript change. Never commit
`console.log`. Never fabricate a data source, a stat, or a "this worked"
claim.
