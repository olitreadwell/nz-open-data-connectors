# Audit gates

Every PR and push runs the gates below. Anything marked **blocking** must
pass before merge; CI mirrors them so a green local `npm run check` is a
green CI.

## Code review

- `alibaba/open-code-review` (`.github/workflows/code-review.yml`) reviews
  every PR when the `LLM_API_KEY` / `LLM_MODEL` / `LLM_BASE_URL` secrets are
  configured (OpenAI- or Anthropic-compatible endpoints). Without the
  secrets the job is skipped so CI stays green.
- Clean-code is enforced locally by ESLint (incl. jsdoc coverage on domain
  exports) + Prettier + strict `tsc`, all part of `npm run check`.

## Security

- `npm audit --audit-level=high` blocks on high/critical advisories
  (`.github/workflows/security.yml` and the CI audit gate).
- Committed-secret scan via `scripts/security-checks.sh`.

## Local equivalents

- `npm run check` — format, lint, type-check, and tests with coverage.
- `npm run test:smoke` — live tests against the real NZ APIs (needs
  `RUN_SMOKE=1`).
