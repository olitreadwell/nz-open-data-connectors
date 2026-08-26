# Keeping this repo in sync with the template

`scripts/sync-from-template.mjs` pulls template-owned files from
`olitreadwell/template` so quality gates and docs never drift. It never
touches app code.

## What syncs

Policies live in `template-manifest.json` **in this repo** — the local
manifest wins over the template's, so each repo controls what syncs in:

- `copy` — replaced verbatim: CI configs, audit docs, issue templates,
  security checks, the sync machinery itself.
- `copyIfAbsent` — added only when missing: `AGENTS.md`, `.nvmrc`,
  `.env.example`.
- `merge` — package.json merges are disabled here. The template targets a
  Next.js + pnpm stack; this repo is npm workspaces, so Next.js-only files
  (eslint config, Lighthouse, `CLAUDE.md`, a11y docs) are excluded and the
  package.json is never merged.

Everything else (`src/**`, `packages/**`, `python/`, `ruby/`, `README.md`,
tests) is left alone.

## Run it

```bash
node scripts/sync-from-template.mjs            # dry-run: what would change
node scripts/sync-from-template.mjs --apply    # write + commit on chore/template-sync
node scripts/sync-from-template.mjs --apply --push  # + push + open a PR
```

`TEMPLATE_URL` env var overrides the template remote.

## Automated weekly sync

`.github/workflows/template-sync.yml` runs weekly (Monday 03:00 UTC) and on
demand (`workflow_dispatch`). It opens a PR named "chore: sync template
files" when anything changed. To let the workflow clone the (private)
template, add a PAT with repo read access as `TEMPLATE_SYNC_TOKEN`; without
it the workflow falls back to the default `GITHUB_TOKEN`.
