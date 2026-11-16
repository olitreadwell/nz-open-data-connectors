import { normalizeSourceApiKey } from './apiKey.js';
import { parseDigitalNzRecords } from './digitalNz.js';
import { readFixtureJson } from './fixtures.js';
import { httpGet } from './http.js';
import type { DigitalNzRecord } from './digitalNz.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the New Zealand Gazette adapter. */
export const NZ_GAZETTE_SOURCE_ID = 'nz-gazette';

/** Options for a Gazette search: optional DigitalNZ key and fetch override. */
export interface NzGazetteSearchOptions {
  apiKey?: string;
  fetchImpl?: typeof globalThis.fetch;
}

/**
 * Fetches the latest New Zealand Gazette notices through DigitalNZ. The v3
 * endpoint answers keyless; a DigitalNZ key only raises the rate limit.
 *
 * @param options - Optional API key and fetch override.
 * @returns The latest Gazette notices as DigitalNZ records.
 */
export async function fetchNzGazetteNotices(
  options: NzGazetteSearchOptions = {}
): Promise<DigitalNzRecord[]> {
  const url = new URL('https://api.digitalnz.org/v3/records.json');
  url.searchParams.set('per_page', '20');
  url.searchParams.set('and[primary_collection][]', 'New Zealand Gazette');
  url.searchParams.set('sort', 'date');
  const apiKey = normalizeSourceApiKey(options.apiKey);
  if (apiKey !== undefined) {
    url.searchParams.set('api_key', apiKey);
  }
  const response = await httpGet('New Zealand Gazette', url, {
    fetchImpl: options.fetchImpl,
  });
  return parseDigitalNzRecords(await response.json());
}

/** New Zealand Gazette adapter: latest notices through DigitalNZ, keyless. */
export const nzGazetteAdapter: NzDataAdapter<DigitalNzRecord[]> = {
  id: NZ_GAZETTE_SOURCE_ID,
  name: 'New Zealand Gazette',
  auth: 'none',
  description: 'Latest New Zealand Gazette notices, newest first, through the DigitalNZ API.',
  fetchLive: (options) =>
    fetchNzGazetteNotices({
      ...(options?.apiKey === undefined ? {} : { apiKey: options.apiKey }),
      ...(options?.fetchImpl === undefined ? {} : { fetchImpl: options.fetchImpl }),
    }),
  parse: parseDigitalNzRecords,
  loadFixture: () => parseDigitalNzRecords(readFixtureJson('nz-gazette-2026-11-16.json')),
};
