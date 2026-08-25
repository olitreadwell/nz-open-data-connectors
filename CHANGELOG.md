# Changelog

## Unreleased

- Connectors: five new keyless adapters - ArcGIS Hub open data (Auckland, Wellington, Canterbury, NZTA), LAWA river quality sites, MfE Data Service, LRIS land and soil layers, Waka Kotahi holiday hotspots
- API: CORS enabled by default (`CORS_ORIGIN` override), per-IP rate limiting (`RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`), zod validation on the probe route, and an OpenAPI contract test that keeps routes and the spec in sync
- Ops: `CONTRIBUTING.md`, per-source connector reference in the README, `npm run audit`, and an advisory dependency audit job in CI
- CI: scheduled nightly live smoke workflow (`smoke.yml`) against the real NZ APIs, plus manual `workflow_dispatch`
- Dockerfile: containerized API with non-root user, health check, and run steps in the README
- API: structured JSON request logs, `/metrics` in Prometheus format, and optional Sentry error tracking (`SENTRY_DSN`, off by default)
- API: e2e test boots the real server over HTTP; error responses are clean JSON
- Docs: plain-language architecture, security, glossary, and releasing guides; `AGENTS.md` rewritten for LLM agents; JSDoc added to every public export
- CI: `v*` tags now create a GitHub Release with auto-generated notes
- Dependencies pinned to exact versions in every `package.json`; `npm run check` now enforces the coverage gate locally
- Python port: pinned deps + `uv.lock`, `ruff` lint, `mypy` type check, coverage gate in CI
- Ruby port: `rubocop` lint, SimpleCov coverage gate in CI (`bundle exec rake check`)
- `npm run check` now includes `format:check`; CI gained a format check job

## 0.1.0 (2026-08-24)

- Initial release: TypeScript connectors with HTTP API and CLI wrappers
- Python port (`nzdata` on PyPI) and Ruby port (`nzdata` gem)
