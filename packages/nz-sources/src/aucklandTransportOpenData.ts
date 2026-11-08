import { fetchDcatCatalogue, parseDcatCatalogue } from './dcatCatalogue.js';
import type { DcatCatalogue, DcatDataset, DcatDistribution } from './dcatCatalogue.js';
import { readFixtureJson } from './fixtures.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Auckland Transport open data adapter. */
export const AUCKLAND_TRANSPORT_OPEN_DATA_SOURCE_ID = 'auckland-transport-open-data';

/** One downloadable representation of an Auckland Transport dataset. */
export type AucklandTransportOpenDataDistribution = DcatDistribution;

/** One dataset in the Auckland Transport DCAT 1.1 catalogue. */
export type AucklandTransportOpenDataDataset = DcatDataset;

/** The Auckland Transport open data catalogue: dataset count plus the rows. */
export type AucklandTransportOpenDataCatalogue = DcatCatalogue;

const AUCKLAND_TRANSPORT_OPEN_DATA_URL =
  'https://data-atgis.opendata.arcgis.com/api/feed/dcat-us/1.1.json';

/**
 * Parses an Auckland Transport open data DCAT 1.1 catalogue payload.
 *
 * @param payload - Raw JSON from the Auckland Transport DCAT feed.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export function parseAucklandTransportOpenDataCatalogue(
  payload: unknown
): AucklandTransportOpenDataCatalogue {
  return parseDcatCatalogue(payload, 'Auckland Transport open data');
}

/**
 * Fetches the Auckland Transport open data DCAT 1.1 catalogue. Keyless;
 * throws on an unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export async function fetchAucklandTransportOpenDataCatalogue(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<AucklandTransportOpenDataCatalogue> {
  return fetchDcatCatalogue(
    'Auckland Transport open data',
    AUCKLAND_TRANSPORT_OPEN_DATA_URL,
    fetchImpl
  );
}

/** Auckland Transport adapter: open GIS catalogue, keyless. */
export const aucklandTransportOpenDataAdapter: NzDataAdapter<AucklandTransportOpenDataCatalogue> = {
  id: AUCKLAND_TRANSPORT_OPEN_DATA_SOURCE_ID,
  name: 'Auckland Transport open data',
  auth: 'none',
  description: 'DCAT 1.1 catalogue of Auckland Transport open GIS datasets.',
  fetchLive: (options) => fetchAucklandTransportOpenDataCatalogue(options?.fetchImpl),
  parse: parseAucklandTransportOpenDataCatalogue,
  loadFixture: () =>
    parseAucklandTransportOpenDataCatalogue(
      readFixtureJson('auckland-transport-open-data-2026-11-08.json')
    ),
};
