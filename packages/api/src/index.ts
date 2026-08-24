import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';

import { probeNzDataSource } from '@nzlab/nz-sources';
import { createStatsNzClient } from '@nzlab/stats-nz';
import type { StatsNzClient } from '@nzlab/stats-nz';

import { OPEN_API_DOCUMENT } from './openapi';
import { createSourcesRoutes } from './routes/sources';
import { createStatsNzRoutes } from './routes/statsNz';

export interface ConnectorsAppOptions {
  statsNzSubscriptionKey?: string;
  apiKeys?: Record<string, string>;
  statsNzClient?: StatsNzClient;
  probeFn?: typeof probeNzDataSource;
}

/** Builds the connectors app. Keys are read from options, never from callers. */
export function createConnectorsApp(options: ConnectorsAppOptions = {}): Hono {
  const client =
    options.statsNzClient ??
    createStatsNzClient(
      options.statsNzSubscriptionKey === undefined
        ? {}
        : { subscriptionKey: options.statsNzSubscriptionKey },
    );

  const app = new Hono();
  app.use('/api/*', cors());
  app.get('/health', (c) => c.json({ ok: true, name: 'nz-open-data-connectors' }));
  app.get('/openapi.json', (c) => c.json(OPEN_API_DOCUMENT));
  app.get('/docs', swaggerUI({ url: '/openapi.json' }));
  const sourcesOptions: { apiKeys?: Record<string, string>; probeFn?: typeof probeNzDataSource } = {};
  if (options.apiKeys !== undefined) {
    sourcesOptions.apiKeys = options.apiKeys;
  }
  if (options.probeFn !== undefined) {
    sourcesOptions.probeFn = options.probeFn;
  }
  app.route('/api', createSourcesRoutes(sourcesOptions));
  app.route('/api', createStatsNzRoutes({ client }));
  return app;
}
