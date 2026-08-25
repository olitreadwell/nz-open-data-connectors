# Changelog

## Unreleased

- Docs: plain-language architecture, security, glossary, and releasing guides; `AGENTS.md` rewritten for LLM agents; JSDoc added to every public export
- CI: `v*` tags now create a GitHub Release with auto-generated notes
- Python port: pinned deps + `uv.lock`, `ruff` lint, `mypy` type check, coverage gate in CI
- Ruby port: `rubocop` lint, SimpleCov coverage gate in CI (`bundle exec rake check`)
- `npm run check` now includes `format:check`; CI gained a format check job

## 0.1.0 (2026-08-24)

- Initial release: TypeScript connectors with HTTP API and CLI wrappers
- Python port (`nzdata` on PyPI) and Ruby port (`nzdata` gem)
