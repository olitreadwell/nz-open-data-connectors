import { fetchDcatCatalogue, parseDcatCatalogue } from './dcatCatalogue.js';
import type { DcatCatalogue, DcatDataset, DcatDistribution } from './dcatCatalogue.js';
import { readFixtureJson } from './fixtures.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Canterbury Maps open data adapter. */
export const CANTERBURY_MAPS_SOURCE_ID = 'canterbury-maps';

/** One downloadable representation of a Canterbury Maps dataset. */
export type CanterburyMapsDistribution = DcatDistribution;

/** One dataset in the Canterbury Maps DCAT 1.1 catalogue. */
export type CanterburyMapsDataset = DcatDataset;

/** The Canterbury Maps catalogue: dataset count plus the rows. */
export type CanterburyMapsCatalogue = DcatCatalogue;

/**
 * Parses a Canterbury Maps DCAT 1.1 catalogue payload.
 *
 * @param payload - Raw JSON from the Canterbury Maps DCAT US 1.1 feed.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export function parseCanterburyMapsCatalogue(payload: unknown): CanterburyMapsCatalogue {
  return parseDcatCatalogue(payload, 'Canterbury Maps');
}

/**
 * Fetches the Canterbury Maps DCAT 1.1 catalogue feed. Keyless; throws on an
 * unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export async function fetchCanterburyMapsCatalogue(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<CanterburyMapsCatalogue> {
  return fetchDcatCatalogue(
    'Canterbury Maps',
    'https://opendata.canterburymaps.govt.nz/api/feed/dcat-us/1.1.json',
    fetchImpl
  );
}

/** Canterbury Maps adapter: open data hub catalogue, keyless. */
export const canterburyMapsAdapter: NzDataAdapter<CanterburyMapsCatalogue> = {
  id: CANTERBURY_MAPS_SOURCE_ID,
  name: 'Canterbury Maps open data',
  auth: 'none',
  description: 'DCAT 1.1 catalogue of Environment Canterbury and partner geospatial datasets.',
  fetchLive: (options) => fetchCanterburyMapsCatalogue(options?.fetchImpl),
  parse: parseCanterburyMapsCatalogue,
  loadFixture: () =>
    parseCanterburyMapsCatalogue(readFixtureJson('canterbury-maps-2026-11-08.json')),
};
