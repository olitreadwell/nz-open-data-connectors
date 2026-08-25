<<<<<<< HEAD
# Contributing

Thanks for helping with the NZ Open Data Connectors. This file explains
how to set up the repo, run the checks, and add a new data source (a
connector). Plain language. Short sentences.

## Repo map

One design, three languages.

- `packages/` - the TypeScript source of truth. This is where adapters,
  the Stats NZ client, the HTTP API, and the CLI live.
- `python/` - a Python port of the same design (package name `nzdata`).
- `ruby/` - a Ruby port of the same design (gem name `nzdata`).

A fix or a new source usually has to land in all three places. See
`docs/ARCHITECTURE.md` for the full map and `docs/GLOSSARY.md` for terms.

## Set up your machine

### TypeScript

1. Install Node.js. The repo pins the version in `.nvmrc`. If you use
   `nvm`, run `nvm use` first.
2. Run `npm ci` to install dependencies. This installs the exact
   versions from `package-lock.json`.

### Python

1. Install [uv](https://docs.astral.sh/uv/).
2. Run `cd python && uv sync`. This creates `.venv/` and installs the
   pinned dependencies from `uv.lock`.

### Ruby

1. Install Ruby and [Bundler](https://bundler.io/).
2. Run `cd ruby && bundle install`. This installs the pinned
   dependencies from `Gemfile.lock`.

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

## Development workflow

`development` is the only integration branch. All PRs merge into
`development`, never straight into `main`.

- Open your PR against `development`.
- CI must pass before the PR merges.
- A blocked draft PR keeps `development` in sync with `main`. It is
  updated as features land and is merged to `main` only when a release
  is ready.
- Keep PRs small. Aim for 100 to 300 lines of change.
- Commit early and often. Keep each commit atomic: one logical change
  per commit.

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
||||||| 2559739
=======
# Contributing

Thanks for contributing to NZ Open Data Connectors.

This guide explains how to set up the repo, run the checks, and open a
pull request (PR). It is written in plain language. If anything is
unclear, open an issue and ask.

## Repo map

One design, three languages.

- `packages/` - the TypeScript source of truth. This is where adapters,
  the Stats NZ client, the HTTP API, and the CLI live.
- `python/` - a Python port of the same design (package name `nzdata`).
- `ruby/` - a Ruby port of the same design (gem name `nzdata`).

A fix or a new source usually has to land in all three places. See
`docs/ARCHITECTURE.md` for the full map and `docs/GLOSSARY.md` for terms.

## Set up your machine

### TypeScript

1. Install Node.js. The repo pins the version in `.nvmrc`. If you use
   `nvm`, run `nvm use` first.
2. Run `npm ci` to install dependencies. This installs the exact
   versions from `package-lock.json`.

### Python

1. Install [uv](https://docs.astral.sh/uv/).
2. Run `cd python && uv sync`. This creates `.venv/` and installs the
   pinned dependencies from `uv.lock`.

### Ruby

1. Install Ruby and [Bundler](https://bundler.io/).
2. Run `cd ruby && bundle install`. This installs the pinned
   dependencies from `Gemfile.lock`.

## Quality gates

Run the checks before you finish any change. The checks must pass on
your machine and in CI (continuous integration).

### TypeScript

```sh
npm run check
```

`npm run check` runs format, lint, type-check, and tests with coverage.

### Python

```sh
cd python && .venv/bin/ruff check src tests && .venv/bin/mypy && .venv/bin/pytest
```

### Ruby

```sh
cd ruby && bundle exec rake check
```

### Rules that apply everywhere

- Coverage stays at or above 60%. Coverage is the share of code that
  tests exercise.
- No `console.log` in committed code. Use `warn` or `error` instead.
- No `any` escape hatches. Use precise types. `any` is a TypeScript type
  that turns off type checking.
- Every exported function has an explicit return type.
- Every export has a doc comment above it.
- Fixtures are real snapshots from the live APIs. Their filenames
  include the capture date, for example
  `agricultural-livestock-regional-council-2025-08-17.csv`.
- Tests never hit the network unless `RUN_SMOKE=1` is set.
- Never fabricate a data source, a stat, or a "this worked" claim.

## Branch naming

Create a branch before you start. Use this pattern:

```
<type>/<domain>/<snake_case_description>/<issue_id>
```

- `<type>` - a Conventional Commits type: `feat`, `fix`, `chore`,
  `refactor`, `docs`, `test`, `perf`, `build`, `ci`, or `style`.
- `<domain>` - the app or area you are changing.
- `<snake_case_description>` - a short description in snake_case.
- `<issue_id>` - the issue or ticket number, when one exists.

Example: `docs/contributing_guide/8`.

## Pull requests

- Keep PRs small. Aim for 100 to 300 lines of change.
- Commit early and often. Keep each commit atomic: one logical change
  per commit.
- Use Conventional Commits for messages. Examples: `feat:`, `fix:`,
  `docs:`, `chore:`.
- When a change affects the shared design, update all three languages:
  TypeScript, Python, and Ruby.
- Run the quality gates above before you push.
- Open the PR with `gh pr create`. Describe what changed and why.

## Smoke tests

Unit tests use committed fixtures, so they run offline. Smoke tests hit
the real APIs. They are opt-in.

TypeScript:

```sh
npm run test:smoke
```

Python:

```sh
cd python && RUN_SMOKE=1 .venv/bin/pytest tests/test_smoke.py
```

Ruby:

```sh
cd ruby && RUN_SMOKE=1 bundle exec rake check
```

Smoke tests need the optional API keys in your environment. See
`README.md` for the list of keys. Endpoints without keys still work.
>>>>>>> origin/development
