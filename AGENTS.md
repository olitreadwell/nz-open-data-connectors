# Agent instructions

TypeScript connectors for New Zealand public data. npm workspaces, one package per concern.

## Quality gates

- No `console.log` in committed code (warn/error allowed)
- No `any` escape hatches
- Every exported function has an explicit return type
- 60% coverage threshold per package
- Never fabricate a data source, a stat, or a "this worked" claim
- Fixtures are real snapshots from the live APIs, dated in their filenames

## Conventions

- Adapters live in `packages/nz-sources`, the Stats NZ client in `packages/stats-nz`
- The HTTP wrapper is `packages/api`, the CLI is `packages/cli`
- Keys are read from env only, server-side. The API and CLI never accept keys from callers
- Tests never hit the network unless `RUN_SMOKE=1` is set
- Run `npm run check` before finishing (lint + type-check + test)
