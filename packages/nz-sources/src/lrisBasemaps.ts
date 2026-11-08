import { httpGet } from './http.js';
import { readFixtureText } from './fixtures.js';
import { parseWmsCapabilities } from './wmsCapabilities.js';
import type { WmsCapabilities } from './wmsCapabilities.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the LRIS topographic basemaps adapter. */
export const LRIS_BASEMAPS_SOURCE_ID = 'lris-basemaps';

const LRIS_BASEMAPS_URL =
  'https://maps.scinfo.org.nz/basemaps/wms?service=WMS&request=GetCapabilities';

/**
 * Parses a LRIS topographic basemaps WMS capabilities response.
 *
 * @param payload - Raw XML from the LRIS basemaps WMS GetCapabilities request.
 * @returns Service metadata and named topographic layers.
 */
export function parseLrisBasemaps(payload: string): WmsCapabilities {
  return parseWmsCapabilities(payload, 'LRIS basemaps');
}

/**
 * Fetches the LRIS topographic basemaps WMS capabilities. Keyless; throws on
 * an unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Service metadata and named topographic layers.
 */
export async function fetchLrisBasemaps(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<WmsCapabilities> {
  const response = await httpGet('LRIS basemaps', LRIS_BASEMAPS_URL, {
    fetchImpl: fetchImpl,
  });
  return parseLrisBasemaps(await response.text());
}

/** LRIS topographic basemaps adapter: keyless OGC WMS catalogue. */
export const lrisBasemapsAdapter: NzDataAdapter<WmsCapabilities> = {
  id: LRIS_BASEMAPS_SOURCE_ID,
  name: 'LRIS topographic basemaps',
  auth: 'none',
  description: 'Landcare Research topographic basemap layers and their WMS metadata.',
  fetchLive: (options) => fetchLrisBasemaps(options?.fetchImpl),
  parse: (payload) => parseLrisBasemaps(String(payload)),
  loadFixture: () => parseLrisBasemaps(readFixtureText('lris-basemaps-wms-2026-11-08.xml')),
};
