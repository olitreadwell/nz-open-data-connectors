# Agent context

Handoff context for a fresh LLM agent thread working in this repo. Read
`AGENTS.md` first, then this file, then `docs/ARCHITECTURE.md` if you need
the full map.

## What this repo is

TypeScript connectors for New Zealand public data, with Python and Ruby
ports. One design, three languages. npm workspaces, one package per
concern.

## Current state

- `development` is the only integration branch. PRs merge into
  `development`; a blocked draft PR keeps `development` in sync with `main`
- Working tree clean; all checks green

## What was just completed

- API hardening: CORS, per-IP rate limiting, zod validation on the probe
  route, OpenAPI contract test
- Five new keyless connectors: ArcGIS Hub (`arcgis`), LAWA (`lawa`), MfE
  Data Service (`mfe`), LRIS (`lris`), Waka Kotahi holiday hotspots
  (`nzta`) - fixtures are real snapshots dated 2026-08-25
- Ops: `CONTRIBUTING.md`, README connector reference, `npm run audit`,
  advisory audit CI job

Earlier: `chore/ports/quality_gates` merged to `main` via PR #3 (five
feature branches).

Five feature branches, each developed in its own git worktree, merged into
`chore/ports/quality_gates`:

| Branch | Change |
| --- | --- |
| `feat/api_observability` | JSON request logs, `/metrics` (Prometheus), Sentry via `SENTRY_DSN` (off by default), clean JSON errors, real-socket e2e test |
| `build/dockerfile` | `Dockerfile` + `.dockerignore`, non-root user, health check; image built and verified healthy |
| `ci/smoke-tests` | `.github/workflows/smoke.yml`: nightly live tests against real NZ APIs, manual dispatch |
| `chore/deps-and-check` | Exact dependency versions in every `package.json`; `npm run check` enforces coverage locally; `ruby/coverage/` gitignored |
| `docs/plain-language` | `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/GLOSSARY.md`, `docs/RELEASING.md`; `AGENTS.md` rewritten; JSDoc on every public export; `release.yml` for `v*` tags |

## Verification status

- TypeScript: `npm run check` passes (format, lint, type-check, tests,
  coverage gate)
- Python: `ruff` + `mypy` + pytest pass, 86.55% coverage
- Ruby: `bundle exec rake check` passes, 78.72% coverage
- All 5 workflow YAMLs valid
- Docker image builds and reports healthy

## Commands

```sh
npm run check          # format + lint + type-check + tests with coverage
npm run test:smoke     # live tests against real APIs (needs RUN_SMOKE=1)
cd python && .venv/bin/ruff check src tests && .venv/bin/mypy && .venv/bin/pytest
cd ruby && bundle exec rake check
```

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
- Test files sit next to their source file (`client.test.ts` tests
  `client.ts`)
- Use 2-3 word, domain-prefixed names for exports
- Pick one spelling per concept and use it everywhere
- Behavior changes to the shared design land in all three languages

## Open items

1. Keep the blocked `development` → `main` draft PR updated as features
   land; merge it to `main` when ready
2. Add GitHub secrets for the smoke workflow: `STATS_NZ_SUBSCRIPTION_KEY`,
   `LINZ_API_KEY`, `DIGITAL_NZ_API_KEY`
3. Decide whether to cut a release (`v0.2.0`); see `docs/RELEASING.md`
4. Watch the first nightly smoke run after merge
5. TS versioning is manual (no changesets); documented in
   `docs/RELEASING.md`
6. Keyed connector backlog (need API keys before live verification):
   NZBN / Companies Office, NIWA tide-UV-solar, Auckland Transport,
   RBNZ, Koordinates - see `docs/CONNECTOR_DISCOVERY.md`

## Docs index

- `AGENTS.md` - agent instructions and repo map
- `docs/ARCHITECTURE.md` - how the pieces fit together
- `docs/SECURITY.md` - key handling and security checklist
- `docs/GLOSSARY.md` - plain-language terms
- `docs/RELEASING.md` - versioning and tags
- `docs/AGENT_CONTEXT.md` - this file

## Tooling notes for agents with Gmail and Plane

- Plane: track work items. List projects first, then create or update
  work items in the right project. Use the `mcp__plane` tools.
- Gmail: use the `mcp__gmail` tools. Draft messages; never auto-send
  without explicit approval.
- Keep all written output in plain language: short sentences, acronyms
  defined on first use.

## Handoff prompt

Copy-paste block for a new agent thread that has Gmail and Plane
connections:

```text
You are working in /Users/olitreadwell/code/nz-open-data-connectors.
Read AGENTS.md and docs/AGENT_CONTEXT.md first. The repo is TypeScript
connectors for NZ public data with Python and Ruby ports; the working
branch is chore/ports/quality_gates, 10 commits ahead of origin, not
pushed, all checks green.

You have Gmail (mcp__gmail) and Plane (mcp__plane) connections.

Tasks:
1. Push chore/ports/quality_gates to origin and open a PR to main with a
   plain-language description of the five merged features.
2. In Plane, list projects, find the right one for this repo, and create
   work items for the open items in docs/AGENT_CONTEXT.md (push + PR,
   GitHub secrets for the smoke workflow, v0.2.0 release decision, first
   nightly smoke run).
3. Draft a Gmail status update to the repo owner summarizing what was
   completed, the verification results, and the open items. Do not send
   it without approval.

Rules: run npm run check before finishing; never fabricate results;
plain language in every message; no console.log in committed code.
```
