import { z } from 'zod';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import { httpGet } from './http.js';
import { createHttp1Fetch } from './http1Fetch.js';
import { readFixtureJson } from './fixtures.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Whanganui District Council GeoNode adapter. */
export const WHANGANUI_GEOSPATIAL_SOURCE_ID = 'whanganui-geospatial';

/** Bounding extent supplied by a Whanganui GeoNode dataset. */
export interface WhanganuiGeoNodeExtent {
  coords: number[];
  srid: string;
}

/** One dataset in the Whanganui District Council GeoNode catalogue. */
export interface WhanganuiGeoNodeDataset {
  key: string;
  name: string;
  title: string;
  abstract: string;
  subtype: string;
  date: string;
  lastUpdated: string;
  detailUrl: string;
  downloadUrl: string;
  workspace: string;
  licenseIdentifier: string;
  extent: WhanganuiGeoNodeExtent;
  ownerUsername: string;
  ownerEmail: string;
}

/** One page of Whanganui GeoNode datasets plus the catalogue total. */
export interface WhanganuiGeoNodeResult {
  total: number;
  page: number;
  pageSize: number;
  datasets: WhanganuiGeoNodeDataset[];
}

const WHANGANUI_GEONODE_LINKS_SCHEMA = z.object({
  next: z.string().nullable(),
  previous: z.string().nullable(),
});

const WHANGANUI_GEONODE_DATASET_SCHEMA = z.object({
  pk: z.string(),
  name: z.string(),
  title: z.string(),
  abstract: z.string(),
  subtype: z.string(),
  date: z.string(),
  last_updated: z.string(),
  detail_url: z.string(),
  download_url: z.string(),
  workspace: z.string(),
  license: z
    .object({
      identifier: z.string().optional().default(''),
    })
    .nullable()
    .optional()
    .default(null),
  extent: z.object({
    coords: z.array(z.number()),
    srid: z.string(),
  }),
  owner: z.object({
    username: z.string(),
    email: z.string(),
  }),
});

const WHANGANUI_GEONODE_RESPONSE_SCHEMA = z.object({
  links: WHANGANUI_GEONODE_LINKS_SCHEMA,
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  datasets: z.array(WHANGANUI_GEONODE_DATASET_SCHEMA),
});

/**
 * Parses a Whanganui GeoNode dataset list response.
 *
 * @param payload - Raw JSON from the GeoNode datasets endpoint.
 * @returns One page of datasets with licence and owner metadata.
 */
export function parseWhanganuiGeoNodeDatasets(payload: unknown): WhanganuiGeoNodeResult {
  const parsed = WHANGANUI_GEONODE_RESPONSE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError('Whanganui GeoNode', parsed.error.message);
  }
  return {
    total: parsed.data.total,
    page: parsed.data.page,
    pageSize: parsed.data.page_size,
    datasets: parsed.data.datasets.map((dataset) => ({
      key: dataset.pk,
      name: dataset.name,
      title: dataset.title,
      abstract: dataset.abstract,
      subtype: dataset.subtype,
      date: dataset.date,
      lastUpdated: dataset.last_updated,
      detailUrl: dataset.detail_url,
      downloadUrl: dataset.download_url,
      workspace: dataset.workspace,
      licenseIdentifier: dataset.license?.identifier ?? '',
      extent: dataset.extent,
      ownerUsername: dataset.owner.username,
      ownerEmail: dataset.owner.email,
    })),
  };
}

/**
 * Fetches the first page of Whanganui District Council GeoNode datasets.
 * Keyless; throws on an unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns One page of 100 datasets plus the catalogue total.
 */
export async function fetchWhanganuiGeoNodeDatasets(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<WhanganuiGeoNodeResult> {
  try {
    return await fetchWhanganuiPage(fetchImpl);
  } catch (error) {
    if (!(error instanceof NzSourceApiError) || !isFetchTransportFailure(error)) {
      throw error;
    }
    return fetchWhanganuiPage(createHttp1Fetch());
  }
}

/** Fetches one page of GeoNode datasets with the supplied fetch implementation. */
async function fetchWhanganuiPage(
  fetchImpl: typeof globalThis.fetch
): Promise<WhanganuiGeoNodeResult> {
  const response = await httpGet(
    'Whanganui GeoNode',
    'https://geonode.whanganui.govt.nz/api/v2/datasets/?page_size=100',
    { fetchImpl: fetchImpl }
  );
  return parseWhanganuiGeoNodeDatasets(await response.json());
}

/** Tests whether a wrapped fetch failure is a transport failure worth retrying. */
function isFetchTransportFailure(error: NzSourceApiError): boolean {
  return error.message.includes('request failed:') || error.message.includes('HTTP/2');
}

/** Whanganui GeoNode adapter: keyless municipal geospatial catalogue. */
export const whanganuiGeospatialAdapter: NzDataAdapter<WhanganuiGeoNodeResult> = {
  id: WHANGANUI_GEOSPATIAL_SOURCE_ID,
  name: 'Whanganui District Council GeoNode',
  auth: 'none',
  description: 'Whanganui District Council geospatial datasets and their licence metadata.',
  fetchLive: (options) => fetchWhanganuiGeoNodeDatasets(options?.fetchImpl),
  parse: parseWhanganuiGeoNodeDatasets,
  loadFixture: () =>
    parseWhanganuiGeoNodeDatasets(readFixtureJson('whanganui-geonode-datasets-2026-11-08.json')),
};
