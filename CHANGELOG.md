# Changelog

## Unreleased

- CI: scheduled nightly live smoke workflow (`smoke.yml`) against the real NZ APIs, plus manual `workflow_dispatch`
- Dockerfile: containerized API with non-root user, health check, and run steps in the README
- API: structured JSON request logs, `/metrics` in Prometheus format, and optional Sentry error tracking (`SENTRY_DSN`, off by default)
- API: e2e test boots the real server over HTTP; error responses are clean JSON
- Python port: pinned deps + `uv.lock`, `ruff` lint, `mypy` type check, coverage gate in CI
- Ruby port: `rubocop` lint, SimpleCov coverage gate in CI (`bundle exec rake check`)
- `npm run check` now includes `format:check`; CI gained a format check job

## 0.1.0 (2026-08-24)

- Initial release: TypeScript connectors with HTTP API and CLI wrappers
- Python port (`nzdata` on PyPI) and Ruby port (`nzdata` gem)
