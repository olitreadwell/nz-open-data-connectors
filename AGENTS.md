# Agent instructions

TypeScript connectors for New Zealand public data, with Python and Ruby
ports. npm workspaces, one package per concern. Read `docs/ARCHITECTURE.md`
for the plain-language map, `docs/GLOSSARY.md` for terms.

## Repo map

- `packages/nz-sources` - 14 adapters, one per NZ data source, plus a shared
  HTTP helper (`src/http.ts`) and committed fixtures (`src/fixtures/`)
- `packages/stats-nz` - Aotearoa Data Explorer (ADE) client
- `packages/api` - HTTP wrapper (Hono), OpenAPI spec, Swagger UI
- `packages/cli` - `nzdata` command line tool
- `packages/nz-mcp` - MCP server for the connectors
- `packages/config-eslint`, `packages/config-typescript` - shared config
- `python/` - Python port, package `nzdata`, not published to PyPI yet
- `ruby/` - Ruby port, gem `nzdata`, not published to RubyGems yet
- `docs/` - architecture, connector discovery, security, glossary, releasing

## Commands

```sh
npm run check          # format + lint + type-check + tests with coverage
npm run test:smoke     # live tests against real APIs (needs RUN_SMOKE=1)
cd python && .venv/bin/ruff check src tests && .venv/bin/mypy && .venv/bin/pytest
cd ruby && bundle exec rake check
```

Run `npm run check` before finishing any TypeScript change. Python and
Ruby changes run their own gates.

## Quality gates

- No `console.log` in committed code (warn/error allowed)
- No `any` escape hatches
- Every exported function has an explicit return type
- Every export has a doc comment above it
- 60% coverage threshold per package, enforced by `npm run check`
- Python: `ruff` + `mypy` + pytest coverage gate, deps pinned in `uv.lock`
- Ruby: `rubocop` + SimpleCov gate via `bundle exec rake check`
- Never fabricate a data source, a stat, or a "this worked" claim
- Fixtures are real snapshots from the live APIs, dated in their filenames

## Conventions

- Adapters live in `packages/nz-sources`, the Stats NZ client in
  `packages/stats-nz`
- The HTTP wrapper is `packages/api`, the CLI is `packages/cli`
- Keys are read from env only, server-side. The API and CLI never accept
  keys from callers
- Tests never hit the network unless `RUN_SMOKE=1` is set
- Test files sit next to their source file (`client.test.ts` tests
  `client.ts`)
- Use 2-3 word, domain-prefixed names for exports
  (`getNzDataSource`, not `get`)
- Pick one spelling per concept and use it everywhere (`dataflowId`, not
  `dataset` in one place and `flow` in another)
- Register a new adapter in `packages/nz-sources/src/registry.ts` and export
  it from `packages/nz-sources/src/index.ts` in the same change
- A new adapter lands in TypeScript first. The ports cover 8 of the 14
  adapters; the six TypeScript-only ones are `arcgis`, `lawa`, `mfe`, `lris`,
  `nzta` and `nzta-open-data`
- Fetches go through `httpGet` in `packages/nz-sources/src/http.ts`, which
  sets the User-Agent, applies the 30 second timeout, and marks 429, 5xx and
  network failures as `retryable`

## Docs for humans and agents

- `docs/ARCHITECTURE.md` - how the pieces fit together
- `docs/CONNECTOR_DISCOVERY.md` - live checks, ruled-out sources, and the
  licence position per source
- `COUNTRY.md` - adapter status and what is not wired up
- `docs/SECURITY.md` - key handling and security checklist
- `docs/GLOSSARY.md` - plain-language terms
- `docs/RELEASING.md` - versioning and tags
- `docs/AGENT_CONTEXT.md` - handoff context for new agent threads
- `CONTRIBUTING.md` - how to contribute, set up, and open a PR

Write docs in plain language. Short sentences. Define acronyms on first
use. The audience includes ESL readers and neurodivergent readers.
