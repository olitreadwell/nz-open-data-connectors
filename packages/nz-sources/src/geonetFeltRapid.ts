import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import { httpGet } from './http.js';
import { createSourceLicense, type NzDataAdapter } from './types.js';

/** Registry id for the GeoNet felt rapid reporting adapter. */
export const GEONET_FELT_RAPID_SOURCE_ID = 'geonet-felt-rapid';

/** One reported shaking location from GeoNet's felt rapid dataset. */
export interface GeoNetFeltRapidPoint {
  mmi: number;
  count: number;
  latitude: number;
  longitude: number;
}

/** A GeoNet felt rapid report: points plus the reported MMI totals. */
export interface GeoNetFeltRapidResult {
  count: number;
  byMmi: Record<string, number>;
  points: GeoNetFeltRapidPoint[];
}

const GEO_NET_FELT_SCHEMA = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.object({
    mmi: z.number(),
    count: z.number(),
  }),
});

const GEO_NET_FELT_RESPONSE_SCHEMA = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(GEO_NET_FELT_SCHEMA),
  count: z.number().optional(),
  count_mmi: z.record(z.string(), z.number()).optional(),
});

/**
 * Parses a GeoNet felt rapid GeoJSON response into shaking points.
 *
 * @param payload - Raw GeoJSON from the GeoNet intensity endpoint.
 * @returns The total report count, MMI totals, and shaking points.
 */
export function parseGeoNetFeltRapid(payload: unknown): GeoNetFeltRapidResult {
  const parsed = GEO_NET_FELT_RESPONSE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError('GeoNet felt rapid', parsed.error.message);
  }
  const points = parsed.data.features.map((feature) => ({
    mmi: feature.properties.mmi,
    count: feature.properties.count,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
  }));
  const byMmi =
    parsed.data.count_mmi ??
    points.reduce<Record<string, number>>((totals, point) => {
      totals[String(point.mmi)] = (totals[String(point.mmi)] ?? 0) + point.count;
      return totals;
    }, {});
  return {
    count: parsed.data.count ?? points.reduce((total, point) => total + point.count, 0),
    byMmi,
    points,
  };
}

/**
 * Fetches the latest felt rapid reports from GeoNet. Keyless.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns The total report count, MMI totals, and shaking points.
 */
export async function fetchGeoNetFeltRapid(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<GeoNetFeltRapidResult> {
  const response = await httpGet(
    'GeoNet felt rapid',
    'https://api.geonet.org.nz/intensity?type=reported',
    { fetchImpl }
  );
  return parseGeoNetFeltRapid(await response.json());
}

/** GeoNet adapter: latest felt rapid reports, keyless. */
export const geonetFeltRapidAdapter: NzDataAdapter<GeoNetFeltRapidResult> = {
  id: GEONET_FELT_RAPID_SOURCE_ID,
  name: 'GeoNet felt rapid reports',
  auth: 'none',
  description: 'Reported shaking locations and Modified Mercalli intensity totals.',
  license: createSourceLicense({
    title: 'Creative Commons Attribution 3.0 New Zealand',
    url: 'https://creativecommons.org/licenses/by/3.0/nz/',
    attribution: 'GeoNet, a collaboration between NHC Toka Tū Ake and Earth Sciences New Zealand',
  }),
  fetchLive: (options) => fetchGeoNetFeltRapid(options?.fetchImpl),
  parse: parseGeoNetFeltRapid,
  loadFixture: () => parseGeoNetFeltRapid(readFixtureJson('geonet-felt-rapid-2026-11-16.json')),
};
