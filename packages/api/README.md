# @nz-open-data-connectors/connectors-api

Internal package. It is not published to npm.

HTTP API that serves the NZ open data connectors to any language. Run it locally or in Docker.

## What this package does

- Wraps `nz-sources` and `stats-nz` in an HTTP API built with Hono.
- Publishes an OpenAPI 3.1 document and Swagger UI.
- Adds request logs, Prometheus metrics, CORS, per-IP rate limiting, and optional Sentry error tracking.
- Validates input with zod at the boundary.

## Install

This package is a workspace dependency. Run it from the repo root.

```sh
npm install
npm run dev:api
```

## Quick start

```sh
npm run dev:api
curl 'http://localhost:8787/api/sources'
```

## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/health` | Health check. |
| GET | `/metrics` | Request counts in Prometheus format. |
| GET | `/openapi.json` | OpenAPI 3.1 spec. |
| GET | `/docs` | Swagger UI. |
| GET | `/api/sources` | List every adapter. |
| GET | `/api/sources/:id/probe` | Live probe one source. |
| GET | `/api/digitalnz/media?q=kiwi&type=images` | DigitalNZ media search. |
| GET | `/api/stats-nz/catalogue` | Every ADE dataflow. |
| GET | `/api/stats-nz/data?dataflowId=AGR_AGR_003` | Data rows as JSON. |
| GET | `/api/stats-nz/data?dataflowId=AGR_AGR_003&format=csv` | Data rows as CSV. |
| GET | `/api/stats-nz/codelist?codelistId=CL_LIVESTOCK_AGR_AGR_003` | Dimension codes to labels. Needs a key. |

## Notes and limits

- The server listens on port 8787 by default. Set `PORT` to change it.
- CORS allows `*` for `/api/*` by default. Set `CORS_ORIGIN` to restrict it.
- The rate limit is 60 requests per minute per IP. Tune it with `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`.
- Sentry is off by default. Set `SENTRY_DSN` to enable it.
- `/api/stats-nz/codelist` needs `STATS_NZ_SUBSCRIPTION_KEY`.
- Keys are read from the environment only. The API never accepts a key from a caller.
- The root `Dockerfile` runs this API on port 8787 with a non-root user and a health check.

## Data sources and licences

- This API reads the same sources as `@nz-open-data-connectors/nz-sources` and `@nz-open-data-connectors/stats-nz`.
- The publishers are GeoNet, data.govt.nz, Stats NZ, DigitalNZ, Trade Me, NZOR, LINZ, ArcGIS Hub portals, LAWA, MfE, Landcare Research LRIS, and Waka Kotahi (NZTA).
- The source URLs are in the `nz-sources` README.
- The data is not covered by the package licence. Each publisher sets the licence for its own data. Check the source page before you reuse a dataset.

## Package licence

MIT. See LICENSE.

## Links

- source: https://github.com/olitreadwell/nz-open-data-connectors/tree/main/packages/api
- docs: https://github.com/olitreadwell/nz-open-data-connectors#readme
