import { Hono } from 'hono';

import { NZ_DATA_SOURCES, probeNzDataSource } from '@nzlab/nz-sources';

export interface SourcesRouteOptions {
  apiKeys?: Record<string, string>;
  probeFn?: typeof probeNzDataSource;
}

/** Routes that list and probe the uniform NZ data source adapters. */
export function createSourcesRoutes(options: SourcesRouteOptions = {}): Hono {
  const app = new Hono();
  const probeFn = options.probeFn ?? probeNzDataSource;

  app.get('/sources', (c) => {
    const sources = NZ_DATA_SOURCES.map((source) => ({
      id: source.id,
      name: source.name,
      auth: source.auth,
      description: source.description,
    }));
    return c.json(sources);
  });

  app.get('/sources/:id/probe', async (c) => {
    const id = c.req.param('id');
    const adapter = NZ_DATA_SOURCES.find((source) => source.id === id);
    if (adapter === undefined) {
      return c.json({ error: `Unknown source: ${id}` }, 404);
    }
    const apiKey = options.apiKeys?.[adapter.id];
    const probe = await probeFn(adapter, apiKey === undefined ? {} : { apiKey });
    return c.json(probe);
  });

  return app;
}
