import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import { httpGet } from './http.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the MBIE open data adapter. */
export const MBIE_OPEN_DATA_SOURCE_ID = 'mbie-open-data';

/** CKAN organisation id that holds MBIE's datasets in the national catalogue. */
export const MBIE_OPEN_DATA_ORGANIZATION = 'ministry-of-business-innovation-and-employment';

/** One downloadable file attached to an MBIE dataset. */
export interface MbieOpenDataResource {
  name: string;
  format: string;
  url: string;
  size: number | null;
}

/** One MBIE dataset in the data.govt.nz catalogue. */
export interface MbieOpenDataDataset {
  name: string;
  title: string;
  notes: string;
  metadataModified: string;
  url: string;
  author: string;
  organization: string | undefined;
  licenseId: string;
  licenseTitle: string;
  licenseUrl: string;
  resources: MbieOpenDataResource[];
}

/** A filtered CKAN package_search response: total count plus MBIE datasets. */
export interface MbieOpenDataSearchResult {
  count: number;
  datasets: MbieOpenDataDataset[];
}

const MBIE_OPEN_DATA_RESOURCE_SCHEMA = z.object({
  name: z.string().optional().default(''),
  format: z.string().optional().default(''),
  url: z.string().optional().default(''),
  size: z.number().nullable().optional().default(null),
});

const MBIE_OPEN_DATA_DATASET_SCHEMA = z.object({
  name: z.string(),
  title: z.string(),
  notes: z.string().optional().default(''),
  metadata_modified: z.string(),
  url: z.string().optional().default(''),
  author: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? ''),
  organization: z
    .object({ title: z.string() })
    .nullable()
    .optional()
    .transform((org) => org?.title),
  license_id: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? ''),
  license_title: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? ''),
  license_url: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? ''),
  resources: z.array(MBIE_OPEN_DATA_RESOURCE_SCHEMA).optional().default([]),
});

const MBIE_OPEN_DATA_RESPONSE_SCHEMA = z.object({
  success: z.literal(true),
  result: z.object({
    count: z.number(),
    results: z.array(MBIE_OPEN_DATA_DATASET_SCHEMA),
  }),
});

/**
 * Parses a data.govt.nz CKAN package_search payload filtered to MBIE.
 *
 * @param payload - Raw JSON from the CKAN package_search endpoint.
 * @returns MBIE datasets with their licence and resource details.
 */
export function parseMbieOpenDataDatasets(payload: unknown): MbieOpenDataSearchResult {
  const parsed = MBIE_OPEN_DATA_RESPONSE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError('MBIE open data', parsed.error.message);
  }
  return {
    count: parsed.data.result.count,
    datasets: parsed.data.result.results.map((dataset) => ({
      name: dataset.name,
      title: dataset.title,
      notes: dataset.notes,
      metadataModified: dataset.metadata_modified,
      url: dataset.url,
      author: dataset.author,
      organization: dataset.organization,
      licenseId: dataset.license_id,
      licenseTitle: dataset.license_title,
      licenseUrl: dataset.license_url,
      resources: dataset.resources.map((resource) => ({
        name: resource.name,
        format: resource.format,
        url: resource.url,
        size: resource.size,
      })),
    })),
  };
}

/**
 * Fetches MBIE's datasets from the national catalogue. Keyless.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns MBIE datasets with their licence and resource details.
 */
export async function fetchMbieOpenDataDatasets(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<MbieOpenDataSearchResult> {
  const url = new URL('https://catalogue.data.govt.nz/api/3/action/package_search');
  url.searchParams.set('fq', `organization:${MBIE_OPEN_DATA_ORGANIZATION}`);
  url.searchParams.set('rows', '1000');
  const response = await httpGet('MBIE open data', url, { fetchImpl: fetchImpl });
  return parseMbieOpenDataDatasets(await response.json());
}

/** MBIE adapter: the ministry's datasets in the national open data catalogue. */
export const mbieOpenDataAdapter: NzDataAdapter<MbieOpenDataSearchResult> = {
  id: MBIE_OPEN_DATA_SOURCE_ID,
  name: 'MBIE open data',
  auth: 'none',
  description: 'MBIE datasets and downloadable resources from the national open data catalogue.',
  fetchLive: (options) => fetchMbieOpenDataDatasets(options?.fetchImpl),
  parse: parseMbieOpenDataDatasets,
  loadFixture: () => parseMbieOpenDataDatasets(readFixtureJson('mbie-open-data-2026-11-07.json')),
};
