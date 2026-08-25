# Releasing

Plain steps for publishing a new version. All publishing happens on git
tags; there is no separate release machine.

## Before any release

1. Update `CHANGELOG.md` under "Unreleased". Write one line per change,
   in plain language.
2. Run the full check for the port you are shipping:
   - TypeScript: `npm run check`
   - Python: `cd python && .venv/bin/ruff check src tests && .venv/bin/mypy && .venv/bin/pytest`
   - Ruby: `cd ruby && bundle exec rake check`
3. Commit the version bump and changelog together.

## TypeScript / HTTP API

The TypeScript packages share version `0.1.0`. Bump it in every
`packages/*/package.json`, update the lockfile, and tag:

```sh
git tag v0.2.0
git push origin v0.2.0
```

The `v*` tag also triggers `.github/workflows/release.yml`, which creates
a GitHub Release with notes, and `.github/workflows/publish-npm.yml`,
which publishes the TypeScript packages to npm.

## Python (`python/`)

1. Bump `version` in `python/pyproject.toml`
2. Commit
3. Tag and push:

```sh
git tag python-v0.2.0
git push origin python-v0.2.0
```

`.github/workflows/publish-python.yml` publishes to PyPI.

## Ruby (`ruby/`)

1. Bump `version` in `ruby/nzdata.gemspec`
2. Commit
3. Tag and push:

```sh
git tag ruby-v0.2.0
git push origin ruby-v0.2.0
```

`.github/workflows/publish-ruby.yml` publishes the gem.

## Keeping tags unique

Each port uses its own tag prefix:
- TypeScript: `v*`
- Python: `python-v*`
- Ruby: `ruby-v*`

`git tag` does not warn when a tag already exists. Check with
`git tag --list "python-v*"` before pushing.
