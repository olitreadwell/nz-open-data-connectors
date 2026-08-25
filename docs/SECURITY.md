# Security

This file explains how the repo handles keys, what the automated checks
are, and what to check before shipping.

## API keys

Three optional keys exist: `STATS_NZ_SUBSCRIPTION_KEY`, `LINZ_API_KEY`,
`DIGITAL_NZ_API_KEY`.

Rules:
- Keys come from the environment only, server-side
- The HTTP API and CLI never accept keys from callers
- Real keys are never committed; `.env` is gitignored
- Commit only `.env.example` (empty values)

## Automated checks

| Check | Command | What it finds |
| --- | --- | --- |
| npm audit | `npm audit --audit-level=high` | Known npm vulnerabilities |
| CodeQL | CI workflow | Security patterns in all three languages |
| Lint | `npm run lint` | Suspicious code patterns |

CI blocks on critical and high npm audit findings. CodeQL runs on every
push.

## Input validation

The HTTP API rejects bad input at the boundary:
- Query parameters go through zod schemas
- Unknown sources answer 404
- Malformed input answers 400

## Security checklist

Before merging a change:
- [ ] No secrets or keys in the diff
- [ ] New endpoints validate input before business logic
- [ ] New keys come from the environment, never from callers
- [ ] New dependencies pass `npm audit`
- [ ] No `console.log` in committed code

## Report a problem

Open an issue in the GitHub repository. For secrets or vulnerabilities,
mention "security" in the title and keep details out of the summary.
