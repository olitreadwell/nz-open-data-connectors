import { httpGet } from './http.js';
import { readFixtureText } from './fixtures.js';
import { parseWmsCapabilities } from './wmsCapabilities.js';
import type { WmsCapabilities } from './wmsCapabilities.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the NIWA River Environment Classification adapter. */
export const NIWA_REC_SOURCE_ID = 'niwa-rec';

const NIWA_REC_URL = 'https://geoserver.niwa.co.nz/rec/wms?service=WMS&request=GetCapabilities';

/**
 * Parses a NIWA River Environment Classification WMS capabilities response.
 *
 * @param payload - Raw XML from the NIWA REC WMS GetCapabilities request.
 * @returns Service metadata and named REC layers.
 */
export function parseNiwaRecCapabilities(payload: string): WmsCapabilities {
  return parseWmsCapabilities(payload, 'NIWA REC');
}

/**
 * Fetches the NIWA River Environment Classification WMS capabilities. Keyless;
 * throws on an unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Service metadata and named REC layers.
 */
export async function fetchNiwaRecCapabilities(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<WmsCapabilities> {
  const response = await httpGet('NIWA REC', NIWA_REC_URL, { fetchImpl: fetchImpl });
  return parseNiwaRecCapabilities(await response.text());
}

/** NIWA REC adapter: keyless OGC WMS catalogue for the river network. */
export const niwaRecAdapter: NzDataAdapter<WmsCapabilities> = {
  id: NIWA_REC_SOURCE_ID,
  name: 'NIWA River Environment Classification',
  auth: 'none',
  description: 'River Environment Classification (REC) layers and their WMS metadata.',
  fetchLive: (options) => fetchNiwaRecCapabilities(options?.fetchImpl),
  parse: (payload) => parseNiwaRecCapabilities(String(payload)),
  loadFixture: () => parseNiwaRecCapabilities(readFixtureText('niwa-rec-wms-2026-11-08.xml')),
};
