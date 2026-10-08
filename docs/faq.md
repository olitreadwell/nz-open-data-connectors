# FAQ

Questions that come up about this repo.

## Do I need an API key?

No. All fourteen adapters work keyless. Two accept an optional key from the
environment to unlock more: `DIGITAL_NZ_API_KEY` raises the DigitalNZ rate
limit and `LINZ_API_KEY` unlocks LINZ layer search. Keys are read server-side
and are never accepted from API or CLI callers.

A key that is set but blank counts as unset. `normalizeSourceApiKey` trims
every key that arrives from an environment variable or a caller, so an empty
`LINZ_API_KEY=` or `DIGITAL_NZ_API_KEY=` goes out keyless rather than as
`api_key=` with a 403 coming back.

## Can I reuse the data?

The MIT licence here covers the code, not the data. Each publisher keeps its
own terms. GeoNet content is Creative Commons Attribution 3.0 New Zealand.
NZOR content is Creative Commons Attribution-NonCommercial-ShareAlike 3.0 New
Zealand, so it is not for commercial use. data.govt.nz and the Waka Kotahi open
data hub carry a licence value per dataset. `docs/CONNECTOR_DISCOVERY.md` lists
the position for every source.

Credit the publisher when you republish, not this library. The connectors fetch
and shape the data; they add nothing to it.

## Why do the tests use fixtures instead of the live APIs?

Fixtures make the suite fast, offline, and the same on every machine. Each
fixture is a real snapshot of a live response, stored in
`packages/nz-sources/src/fixtures/`. Live calls are opt-in through
`npm run test:smoke` with `RUN_SMOKE=1`. If a source changes shape, the live
smoke run is what catches it.

## Will calling the API get me blocked?

Every adapter sends a descriptive `User-Agent`
(`nz-open-data-connectors (Language=TypeScript)`), waits at most 30
seconds, and marks HTTP 429, HTTP 5xx and network failures as `retryable` on
the thrown `NzSourceApiError`. Nothing retries automatically, so the caller
decides the backoff.

## Can I use this from Python, R, or Julia?

Yes, two ways. Run the HTTP API (`npm run dev:api`) and call
`GET /api/sources/:id/probe`, or run the CLI and read JSON or CSV from stdout.
There is also a Python port and a Ruby port in `python/` and `ruby/`, neither
published yet, so install those from the repo.

## How do I add a source?

Write one adapter in `packages/nz-sources/src`, give it a live fetch, a strict
parse, and a committed fixture, then register it in
`packages/nz-sources/src/registry.ts` and export it from
`packages/nz-sources/src/index.ts`. The
API and the CLI pick it up from the registry. `docs/ARCHITECTURE.md` describes
the interface.

## A source has moved or died. How do I report it?

Open an issue with the adapter id, the command you ran, and the response you
saw. Dead sources are worth knowing about even when we cannot fix them; see
the "Not wired up" table in `COUNTRY.md` for the ones already ruled out.

## Who maintains this?

Oli Treadwell (`@olitreadwell`). Careful issues and pull requests are welcome.
The open work is listed in `COUNTRY.md` and `docs/AGENT_CONTEXT.md`.
