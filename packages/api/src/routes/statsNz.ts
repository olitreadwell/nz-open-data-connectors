import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { serializeStatsNzRowsToCsv } from '@nzlab/stats-nz';
import type { StatsNzClient } from '@nzlab/stats-nz';

const dataQuerySchema = z.object({
  dataflowId: z.string().min(1),
  format: z.enum(['json', 'csv']).optional(),
});

const codelistQuerySchema = z.object({
  codelistId: z.string().min(1),
});

/** Options for the Stats NZ routes. */
export interface StatsNzRouteOptions {
  client: StatsNzClient;
}

/** Routes that wrap the Aotearoa Data Explorer client. */
export function createStatsNzRoutes(options: StatsNzRouteOptions): Hono {
  const app = new Hono();

  app.get('/stats-nz/catalogue', async (c) => {
    const dataflows = await options.client.getDataflowCatalogue();
    return c.json({ dataflows });
  });

  app.get('/stats-nz/data', zValidator('query', dataQuerySchema), async (c) => {
    const { dataflowId, format } = c.req.valid('query');
    const rows = await options.client.getData({ dataflowId, format: 'csv' });
    if (format === 'csv') {
      return c.text(serializeStatsNzRowsToCsv(rows), 200, {
        'Content-Type': 'text/csv; charset=utf-8',
      });
    }
    return c.json({ dataflowId, rows });
  });

  app.get('/stats-nz/codelist', zValidator('query', codelistQuerySchema), async (c) => {
    const { codelistId } = c.req.valid('query');
    const codelist = await options.client.getCodelist(codelistId);
    return c.json(codelist);
  });

  return app;
}
