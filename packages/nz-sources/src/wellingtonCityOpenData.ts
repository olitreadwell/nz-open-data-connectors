import { fetchDcatCatalogue, parseDcatCatalogue } from './dcatCatalogue.js';
import type { DcatCatalogue, DcatDataset, DcatDistribution } from './dcatCatalogue.js';
import { readFixtureJson } from './fixtures.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Wellington City open data adapter. */
export const WELLINGTON_CITY_OPEN_DATA_SOURCE_ID = 'wellington-city-open-data';

/** One downloadable representation of a Wellington City dataset. */
export type WellingtonCityOpenDataDistribution = DcatDistribution;

/** One dataset in the Wellington City DCAT 1.1 catalogue. */
export type WellingtonCityOpenDataDataset = DcatDataset;

/** The Wellington City catalogue: dataset count plus the rows. */
export type WellingtonCityOpenDataCatalogue = DcatCatalogue;

/**
 * Parses a Wellington City DCAT 1.1 catalogue payload.
 *
 * @param payload - Raw JSON from the Wellington City DCAT US 1.1 feed.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export function parseWellingtonCityOpenDataCatalogue(
  payload: unknown
): WellingtonCityOpenDataCatalogue {
  return parseDcatCatalogue(payload, 'Wellington City open data');
}

/**
 * Fetches the Wellington City DCAT 1.1 catalogue feed. Keyless; throws on an
 * unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export async function fetchWellingtonCityOpenDataCatalogue(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<WellingtonCityOpenDataCatalogue> {
  return fetchDcatCatalogue(
    'Wellington City open data',
    'https://data-wcc.opendata.arcgis.com/api/feed/dcat-us/1.1.json',
    fetchImpl
  );
}

/** Wellington City adapter: open data hub catalogue, keyless. */
export const wellingtonCityOpenDataAdapter: NzDataAdapter<WellingtonCityOpenDataCatalogue> = {
  id: WELLINGTON_CITY_OPEN_DATA_SOURCE_ID,
  name: 'Wellington City open data',
  auth: 'none',
  description: 'DCAT 1.1 catalogue of Wellington City Council geospatial datasets.',
  fetchLive: (options) => fetchWellingtonCityOpenDataCatalogue(options?.fetchImpl),
  parse: parseWellingtonCityOpenDataCatalogue,
  loadFixture: () =>
    parseWellingtonCityOpenDataCatalogue(
      readFixtureJson('wellington-city-open-data-2026-11-08.json')
    ),
};
