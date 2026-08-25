# Changelog

## Unreleased

- CI: scheduled nightly live smoke workflow (`smoke.yml`) against the real NZ APIs, plus manual `workflow_dispatch`
- Python port: pinned deps + `uv.lock`, `ruff` lint, `mypy` type check, coverage gate in CI
- Ruby port: `rubocop` lint, SimpleCov coverage gate in CI (`bundle exec rake check`)
- `npm run check` now includes `format:check`; CI gained a format check job

## 0.1.0 (2026-08-24)

- Initial release: TypeScript connectors with HTTP API and CLI wrappers
- Python port (`nzdata` on PyPI) and Ruby port (`nzdata` gem)
