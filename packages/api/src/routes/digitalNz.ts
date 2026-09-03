import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { DIGITAL_NZ_MEDIA_TYPES, searchDigitalNzMedia } from '@nzlab/nz-sources';
import type { DigitalNzMediaType } from '@nzlab/nz-sources';

const mediaQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(DIGITAL_NZ_MEDIA_TYPES).optional(),
});

/** Options for the DigitalNZ routes. */
export interface DigitalNzRouteOptions {
  apiKey?: string;
  searchMedia?: typeof searchDigitalNzMedia;
}

/** Routes that wrap the DigitalNZ media search. */
export function createDigitalNzRoutes(options: DigitalNzRouteOptions = {}): Hono {
  const app = new Hono();
  const searchMedia = options.searchMedia ?? searchDigitalNzMedia;

  app.get('/digitalnz/media', zValidator('query', mediaQuerySchema), async (c) => {
    const { q, type } = c.req.valid('query');
    const mediaType: DigitalNzMediaType = type ?? 'images';
    const apiKey = options.apiKey;
    const records = await searchMedia(q, mediaType, apiKey === undefined ? {} : { apiKey });
    return c.json({ query: q, mediaType, records });
  });

  return app;
}
