import { fetchDcatCatalogue, parseDcatCatalogue } from './dcatCatalogue.js';
import type { DcatCatalogue, DcatDataset, DcatDistribution } from './dcatCatalogue.js';
import { readFixtureJson } from './fixtures.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Christchurch City open data adapter. */
export const CHRISTCHURCH_OPEN_DATA_SOURCE_ID = 'christchurch-open-data';

/** One downloadable representation of a Christchurch City dataset. */
export type ChristchurchOpenDataDistribution = DcatDistribution;

/** One dataset in the Christchurch City DCAT 1.1 catalogue. */
export type ChristchurchOpenDataDataset = DcatDataset;

/** The Christchurch City open data catalogue: dataset count plus the rows. */
export type ChristchurchOpenDataCatalogue = DcatCatalogue;

const CHRISTCHURCH_OPEN_DATA_URL =
  'https://opendata-christchurchcity.hub.arcgis.com/api/feed/dcat-us/1.1.json';

/**
 * Parses a Christchurch City open data DCAT 1.1 catalogue payload.
 *
 * @param payload - Raw JSON from the Christchurch City DCAT feed.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export function parseChristchurchOpenDataCatalogue(
  payload: unknown
): ChristchurchOpenDataCatalogue {
  return parseDcatCatalogue(payload, 'Christchurch open data');
}

/**
 * Fetches the Christchurch City open data DCAT 1.1 catalogue. Keyless; throws
 * on an unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export async function fetchChristchurchOpenDataCatalogue(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<ChristchurchOpenDataCatalogue> {
  return fetchDcatCatalogue('Christchurch open data', CHRISTCHURCH_OPEN_DATA_URL, fetchImpl);
}

/** Christchurch City adapter: open data hub catalogue, keyless. */
export const christchurchOpenDataAdapter: NzDataAdapter<ChristchurchOpenDataCatalogue> = {
  id: CHRISTCHURCH_OPEN_DATA_SOURCE_ID,
  name: 'Christchurch City open data',
  auth: 'none',
  description: 'DCAT 1.1 catalogue of Christchurch City Council open datasets.',
  fetchLive: (options) => fetchChristchurchOpenDataCatalogue(options?.fetchImpl),
  parse: parseChristchurchOpenDataCatalogue,
  loadFixture: () =>
    parseChristchurchOpenDataCatalogue(readFixtureJson('christchurch-open-data-2026-11-08.json')),
};
