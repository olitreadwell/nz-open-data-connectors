import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { httpGet } from './http.js';
import { readFixtureJson } from './fixtures.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Stats NZ Geographic Data Service adapter. */
export const STATS_NZ_GEOGRAPHIC_SOURCE_ID = 'stats-nz-geographic';

/** One layer in the Stats NZ Geographic Data Service catalogue. */
export interface StatsNzGeographicLayer {
  id: number;
  title: string;
  url: string;
  type: string;
  firstPublishedAt: string;
  publishedAt: string;
  featuredAt: string | null;
  servicesUrl: string;
  publicAccess: string;
  capabilities: string[];
  permissions: string[];
}

const STATS_NZ_GEOGRAPHIC_LAYER_SCHEMA = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  type: z.string(),
  first_published_at: z.string(),
  published_at: z.string(),
  featured_at: z.string().nullable().optional().default(null),
  services: z.string(),
  public_access: z.string(),
  user_capabilities: z.array(z.string()).optional().default([]),
  user_permissions: z.array(z.string()).optional().default([]),
});

const STATS_NZ_GEOGRAPHIC_RESPONSE_SCHEMA = z.array(STATS_NZ_GEOGRAPHIC_LAYER_SCHEMA);

/**
 * Parses a Stats NZ Geographic Data Service layer search response.
 *
 * @param payload - Raw JSON from the datafinder layer search endpoint.
 * @returns Layer records with publication dates and access level.
 */
export function parseStatsNzGeographicLayers(payload: unknown): StatsNzGeographicLayer[] {
  const parsed = STATS_NZ_GEOGRAPHIC_RESPONSE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError('Stats NZ Geographic Data Service', parsed.error.message);
  }
  return parsed.data.map((layer) => ({
    id: layer.id,
    title: layer.title,
    url: layer.url,
    type: layer.type,
    firstPublishedAt: layer.first_published_at,
    publishedAt: layer.published_at,
    featuredAt: layer.featured_at,
    servicesUrl: layer.services,
    publicAccess: layer.public_access,
    capabilities: layer.user_capabilities,
    permissions: layer.user_permissions,
  }));
}

/**
 * Searches the Stats NZ Geographic Data Service catalogue. Keyless; throws on
 * an unreachable API.
 *
 * @param query - Layer search text, e.g. "meshblock".
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Layer records matching the query.
 */
export async function searchStatsNzGeographicLayers(
  query: string,
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<StatsNzGeographicLayer[]> {
  const url = `https://datafinder.stats.govt.nz/services/api/v1/layers?search=${encodeURIComponent(query)}`;
  const response = await httpGet('Stats NZ Geographic Data Service', url, {
    fetchImpl: fetchImpl,
  });
  return parseStatsNzGeographicLayers(await response.json());
}

/**
 * Fetches the default Stats NZ Geographic Data Service layer search.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Layer records for the meshblock search.
 */
export async function fetchStatsNzGeographicLayers(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<StatsNzGeographicLayer[]> {
  return searchStatsNzGeographicLayers('meshblock', fetchImpl);
}

/** Stats NZ Geographic Data Service adapter: keyless layer search. */
export const statsNzGeographicAdapter: NzDataAdapter<StatsNzGeographicLayer[]> = {
  id: STATS_NZ_GEOGRAPHIC_SOURCE_ID,
  name: 'Stats NZ Geographic Data Service',
  auth: 'none',
  description: 'Searches Stats NZ geographic layers published on datafinder.',
  fetchLive: (options) => fetchStatsNzGeographicLayers(options?.fetchImpl),
  parse: parseStatsNzGeographicLayers,
  loadFixture: () =>
    parseStatsNzGeographicLayers(readFixtureJson('stats-nz-geographic-meshblock-2026-11-08.json')),
};
