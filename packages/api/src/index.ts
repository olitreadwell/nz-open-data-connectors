import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";

import { probeNzDataSource } from "@nzlab/nz-sources";
import { createStatsNzClient } from "@nzlab/stats-nz";
import type { StatsNzClient } from "@nzlab/stats-nz";

import { OPEN_API_DOCUMENT } from "./openapi";
import { createErrorTracker } from "./errorTracking";
import {
  createRequestLogger,
  defaultLogWrite,
  writeLogEvent,
  type LogWrite,
} from "./logger";
import {
  createMetricsCounter,
  createMetricsMiddleware,
  renderPrometheusMetrics,
  type RequestMetrics,
} from "./metrics";
import { createSourcesRoutes } from "./routes/sources";
import { createStatsNzRoutes } from "./routes/statsNz";

export interface ConnectorsAppOptions {
  statsNzSubscriptionKey?: string;
  apiKeys?: Record<string, string>;
  statsNzClient?: StatsNzClient;
  probeFn?: typeof probeNzDataSource;
  sentryDsn?: string;
  logWrite?: LogWrite;
  metrics?: RequestMetrics;
}

/**
 * Builds the connectors app. Keys are read from options, never from callers.
 *
 * @param options - Optional keys, client overrides, and observability hooks.
 * @returns A configured Hono app.
 */
export function createConnectorsApp(options: ConnectorsAppOptions = {}): Hono {
  const client =
    options.statsNzClient ??
    createStatsNzClient(
      options.statsNzSubscriptionKey === undefined
        ? {}
        : { subscriptionKey: options.statsNzSubscriptionKey },
    );

  const app = new Hono();
  const logWrite = options.logWrite ?? defaultLogWrite;
  const metrics = options.metrics ?? createMetricsCounter();
  const errorTracker = createErrorTracker(options.sentryDsn);

  app.use("*", createRequestLogger(logWrite));
  app.use("*", createMetricsMiddleware(metrics));
  app.use("/api/*", cors());
  app.get("/health", (c) =>
    c.json({ ok: true, name: "nz-open-data-connectors" }),
  );
  app.get("/openapi.json", (c) => c.json(OPEN_API_DOCUMENT));
  app.get("/docs", swaggerUI({ url: "/openapi.json" }));
  app.get("/metrics", (c) => c.text(renderPrometheusMetrics(metrics)));
  const sourcesOptions: {
    apiKeys?: Record<string, string>;
    probeFn?: typeof probeNzDataSource;
  } = {};
  if (options.apiKeys !== undefined) {
    sourcesOptions.apiKeys = options.apiKeys;
  }
  if (options.probeFn !== undefined) {
    sourcesOptions.probeFn = options.probeFn;
  }
  app.route("/api", createSourcesRoutes(sourcesOptions));
  app.route("/api", createStatsNzRoutes({ client }));
  app.notFound((c) => c.json({ error: "not_found" }, 404));
  app.onError((error, c) => {
    const message = error instanceof Error ? error.message : String(error);
    errorTracker.report(error, { path: c.req.path });
    writeLogEvent(
      {
        ts: new Date().toISOString(),
        level: "error",
        event: "unhandled_error",
        path: c.req.path,
        message,
      },
      logWrite,
    );
    return c.json({ error: "internal_error" }, 500);
  });
  return app;
}
