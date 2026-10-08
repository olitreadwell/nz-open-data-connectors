# Agent context

Handoff context for a fresh agent thread working in this repo. Read
`AGENTS.md` first, then this file, then `docs/ARCHITECTURE.md` if you need
the full map.

## What this repo is

TypeScript connectors for New Zealand public data, with Python and Ruby ports.
One design, three languages. `packages/nz-sources` holds the 14 adapters,
`packages/stats-nz` reads the Aotearoa Data Explorer (ADE) API,
`packages/api` exposes both over HTTP, and `packages/cli` exposes them as
`nzdata`. npm workspaces, one package per concern.

## Current state

- `main` is the integration branch. Pull requests target `main`.
- Fourteen adapters, all keyless. DigitalNZ and LINZ accept an optional key
  from the environment to unlock more.
- Every adapter fetches through `packages/nz-sources/src/http.ts` (`httpGet`):
  one `User-Agent`, a 30 second timeout, and `retryable` set on HTTP 429,
  HTTP 5xx and network failures.
- Adapters live in `packages/nz-sources/src/*.ts` next to their tests, with
  committed fixtures in `packages/nz-sources/src/fixtures/`. Fixture filenames
  carry the capture date.
- The Python and Ruby ports cover 8 of the 14 adapters plus the Stats NZ
  client. Porting the other six is separate work.
- `npm run check`, the Python gate and `bundle exec rake check` (Ruby) are
  green.

## Commands

```sh
npm run check          # format + lint + type-check + tests with coverage
npm run test:smoke     # live tests against real APIs (needs RUN_SMOKE=1)
cd python && .venv/bin/ruff check src tests && .venv/bin/mypy && .venv/bin/pytest
cd ruby && bundle exec rake check
```

The Python venv comes from `uv sync --extra dev`; a plain `uv sync` leaves out
pytest, ruff and mypy.

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

- Adapters live in `packages/nz-sources`, Stats NZ client in
  `packages/stats-nz`
- HTTP wrapper is `packages/api`, CLI is `packages/cli`
- Keys are read from env only, server-side. API and CLI never accept keys
  from callers
- Tests never hit the network unless `RUN_SMOKE=1` is set
- Test files sit next to their source file (`geonet.test.ts` tests
  `geonet.ts`)
- Use 2-3 word, domain-prefixed names for exports
- Pick one spelling per concept and use it everywhere
- A new adapter is registered in `packages/nz-sources/src/registry.ts` and
  exported from `packages/nz-sources/src/index.ts` in the same change
- A new adapter lands in TypeScript first. The ports follow only when someone
  ports the adapter

## Open items

1. Publish the ports. `nzdata` is free on PyPI and RubyGems, and the publish
   workflows fire on `python-v*` and `ruby-v*` tags. Trusted publishing has to
   be enabled on PyPI before the first tag.
2. Per-source licence and attribution metadata is not in the adapter output.
   Only `nzta-open-data` passes a licence value through. The licence position
   per source is written down in `docs/CONNECTOR_DISCOVERY.md`.
3. Port the six missing adapters to Python and Ruby (`arcgis`, `lawa`, `mfe`,
   `lris`, `nzta`, `nzta-open-data`).
4. Keyed connector backlog, each needing an API key before a live check:
   NZBN / Companies Office, NIWA, RBNZ, Koordinates, Auckland Transport. See
   `docs/CONNECTOR_DISCOVERY.md`.
5. `docs/a11y.md`, `docs/api.md`, `docs/audits.md`, `docs/ci-optimization.md`
   and `docs/template-sync.md` are copied from `olitreadwell/template` and
   still describe the Next.js template (`pnpm`, `/api/hello`). Editing them
   here is overwritten on the next template sync, so the fix belongs in the
   template repo.

## Docs index

- `AGENTS.md` - agent instructions and repo map
- `docs/ARCHITECTURE.md` - how the pieces fit together
- `docs/CONNECTOR_DISCOVERY.md` - live checks and the licence position per source
- `docs/SECURITY.md` - key handling and security checklist
- `docs/GLOSSARY.md` - plain-language terms
- `docs/RELEASING.md` - versioning and tags
- `docs/AGENT_CONTEXT.md` - this file
- `COUNTRY.md` - adapter status and what is not wired up
