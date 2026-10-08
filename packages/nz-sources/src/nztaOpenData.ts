import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { httpGet } from './http.js';
import { readFixtureJson } from './fixtures.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Waka Kotahi (NZTA) open data adapter. */
export const NZTA_OPEN_DATA_SOURCE_ID = 'nzta-open-data';

/** One downloadable representation of a Waka Kotahi open data dataset. */
export interface NztaOpenDataDistribution {
  title: string;
  format: string;
  mediaType: string;
  accessUrl: string;
}

/** One dataset in the Waka Kotahi (NZTA) open data DCAT 1.1 catalogue. */
export interface NztaOpenDataDataset {
  identifier: string;
  title: string;
  description: string;
  landingPage: string;
  keywords: string[];
  issued: string;
  modified: string;
  publisher: string;
  contactName: string;
  contactEmail: string;
  license: string;
  themes: string[];
  spatial: string;
  distributions: NztaOpenDataDistribution[];
}

/** The Waka Kotahi open data catalogue: dataset count plus the rows. */
export interface NztaOpenDataCatalogue {
  count: number;
  datasets: NztaOpenDataDataset[];
}

const NZTA_OPEN_DATA_DISTRIBUTION_SCHEMA = z.object({
  title: z.string(),
  format: z.string(),
  mediaType: z.string(),
  accessURL: z.string(),
});

const NZTA_OPEN_DATA_CONTACT_SCHEMA = z.object({
  fn: z.string(),
  hasEmail: z.string().optional().default(''),
});

const NZTA_OPEN_DATA_DATASET_SCHEMA = z.object({
  '@type': z.literal('dcat:Dataset'),
  identifier: z.string(),
  title: z.string(),
  description: z.string().optional().default(''),
  landingPage: z.string().optional().default(''),
  keyword: z.array(z.string()).optional().default([]),
  issued: z.string().optional().default(''),
  modified: z.string().optional().default(''),
  publisher: z.object({ name: z.string() }).optional(),
  contactPoint: NZTA_OPEN_DATA_CONTACT_SCHEMA.optional(),
  license: z.string().optional().default(''),
  theme: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default(''),
  spatial: z.string().optional().default(''),
  distribution: z.array(NZTA_OPEN_DATA_DISTRIBUTION_SCHEMA).optional().default([]),
});

const NZTA_OPEN_DATA_CATALOGUE_SCHEMA = z.object({
  '@type': z.literal('dcat:Catalog'),
  dataset: z.array(NZTA_OPEN_DATA_DATASET_SCHEMA),
});

/**
 * Normalizes a DCAT theme, which the feed sends as a list or a bare string.
 *
 * @param theme - Theme list, empty string, or a single theme name.
 * @returns Theme names with empty entries removed.
 */
function normalizeNztaOpenDataThemes(theme: string | string[]): string[] {
  if (typeof theme === 'string') {
    return theme.length > 0 ? [theme] : [];
  }
  return theme.filter((name) => name.length > 0);
}

/**
 * Parses a Waka Kotahi (NZTA) open data DCAT 1.1 catalogue payload.
 *
 * @param payload - Raw JSON from the NZTA DCAT US 1.1 catalogue feed.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export function parseNztaOpenDataCatalogue(payload: unknown): NztaOpenDataCatalogue {
  const parsed = NZTA_OPEN_DATA_CATALOGUE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError('NZTA open data', parsed.error.message);
  }
  const datasets = parsed.data.dataset.map((dataset) => ({
    identifier: dataset.identifier,
    title: dataset.title,
    description: dataset.description,
    landingPage: dataset.landingPage,
    keywords: dataset.keyword,
    issued: dataset.issued,
    modified: dataset.modified,
    publisher: dataset.publisher?.name ?? '',
    contactName: dataset.contactPoint?.fn ?? '',
    contactEmail: (dataset.contactPoint?.hasEmail ?? '').replace(/^mailto:/i, ''),
    license: dataset.license,
    themes: normalizeNztaOpenDataThemes(dataset.theme),
    spatial: dataset.spatial,
    distributions: dataset.distribution.map((distribution) => ({
      title: distribution.title,
      format: distribution.format,
      mediaType: distribution.mediaType,
      accessUrl: distribution.accessURL,
    })),
  }));
  return { count: datasets.length, datasets };
}

/**
 * Fetches the Waka Kotahi (NZTA) open data DCAT 1.1 catalogue feed. Keyless.
 * Falls back to a committed fixture when the API is unreachable.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export async function fetchNztaOpenDataCatalogue(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<NztaOpenDataCatalogue> {
  const response = await httpGet(
    'NZTA open data',
    'https://opendata-nzta.opendata.arcgis.com/api/feed/dcat-us/1.1.json',
    { fetchImpl: fetchImpl }
  );
  return parseNztaOpenDataCatalogue(await response.json());
}

/** Waka Kotahi (NZTA) adapter: open data hub catalogue, keyless. */
export const nztaOpenDataAdapter: NzDataAdapter<NztaOpenDataCatalogue> = {
  id: NZTA_OPEN_DATA_SOURCE_ID,
  name: 'Waka Kotahi open data hub',
  auth: 'none',
  description: 'DCAT 1.1 catalogue of Waka Kotahi (NZTA) transport and road datasets.',
  fetchLive: (options) => fetchNztaOpenDataCatalogue(options?.fetchImpl),
  parse: parseNztaOpenDataCatalogue,
  loadFixture: () => parseNztaOpenDataCatalogue(readFixtureJson('nzta-open-data-2026-10-05.json')),
};
