import { fetchDcatCatalogue, parseDcatCatalogue } from './dcatCatalogue.js';
import type { DcatCatalogue, DcatDataset, DcatDistribution } from './dcatCatalogue.js';
import { readFixtureJson } from './fixtures.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Waka Kotahi (NZTA) open data adapter. */
export const NZTA_OPEN_DATA_SOURCE_ID = 'nzta-open-data';

/** One downloadable representation of a Waka Kotahi open data dataset. */
export type NztaOpenDataDistribution = DcatDistribution;

/** One dataset in the Waka Kotahi (NZTA) open data DCAT 1.1 catalogue. */
export type NztaOpenDataDataset = DcatDataset;

/** The Waka Kotahi open data catalogue: dataset count plus the rows. */
export type NztaOpenDataCatalogue = DcatCatalogue;

/**
 * Parses a Waka Kotahi (NZTA) open data DCAT 1.1 catalogue payload.
 *
 * @param payload - Raw JSON from the NZTA DCAT US 1.1 catalogue feed.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export function parseNztaOpenDataCatalogue(payload: unknown): NztaOpenDataCatalogue {
  return parseDcatCatalogue(payload, 'NZTA open data');
}

/**
 * Fetches the Waka Kotahi (NZTA) open data DCAT 1.1 catalogue feed. Keyless.
 * Throws on an unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export async function fetchNztaOpenDataCatalogue(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<NztaOpenDataCatalogue> {
  return fetchDcatCatalogue(
    'NZTA open data',
    'https://opendata-nzta.opendata.arcgis.com/api/feed/dcat-us/1.1.json',
    fetchImpl
  );
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
