import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import { httpGet } from './http.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Auckland Museum API adapter. */
export const AUCKLAND_MUSEUM_SOURCE_ID = 'auckland-museum';

/** One collection record from the Auckland Museum API. */
export interface AucklandMuseumRecord {
  id: string;
  title: string;
  description: string;
  type: string;
  departments: string[];
  identifiers: string[];
  /** First copyright statement, kept for callers of the original field. */
  copyright: string;
  /** Every copyright or rights statement the record carries. */
  copyrightStatements: string[];
  /** Source contributors, including authors and issuing bodies. */
  contributors: string[];
  primaryRepresentation: string | null;
  lastModified: string | null;
}

/** A collection search result from the Auckland Museum API. */
export interface AucklandMuseumSearchResult {
  total: number;
  records: AucklandMuseumRecord[];
}

const AUCKLAND_MUSEUM_SOURCE_SCHEMA = z
  .object({
    dc_title: z.array(z.string()).optional().default([]),
    dc_description: z.array(z.string()).optional().default([]),
    type: z.string().optional().default(''),
    department: z.array(z.string()).optional().default([]),
    dc_identifier: z.array(z.string()).optional().default([]),
    copyright: z.array(z.string()).optional().default([]),
    dc_contributor: z.array(z.string()).optional().default([]),
    primaryRepresentation: z.string().nullable().optional(),
    lastModifiedOn: z.array(z.string()).optional().default([]),
    appellation: z
      .object({
        'Primary Title': z.array(z.string()).optional().default([]),
      })
      .loose()
      .optional(),
  })
  .loose();

const AUCKLAND_MUSEUM_HIT_SCHEMA = z.object({
  _id: z.string(),
  _source: AUCKLAND_MUSEUM_SOURCE_SCHEMA,
});

const AUCKLAND_MUSEUM_RESPONSE_SCHEMA = z.object({
  hits: z.object({
    total: z.union([z.number(), z.object({ value: z.number() })]),
    hits: z.array(AUCKLAND_MUSEUM_HIT_SCHEMA),
  }),
});

function toRecord(hit: z.infer<typeof AUCKLAND_MUSEUM_HIT_SCHEMA>): AucklandMuseumRecord {
  const source = hit._source;
  return {
    id: hit._id,
    title: source.appellation?.['Primary Title']?.[0] ?? source.dc_title[0] ?? '',
    description: source.dc_description[0] ?? '',
    type: source.type,
    departments: source.department,
    identifiers: source.dc_identifier,
    copyright: source.copyright[0] ?? '',
    copyrightStatements: source.copyright,
    contributors: source.dc_contributor,
    primaryRepresentation: source.primaryRepresentation ?? null,
    lastModified: source.lastModifiedOn[0] ?? null,
  };
}

/**
 * Parses an Auckland Museum Elasticsearch response into collection records.
 *
 * @param payload - Raw JSON from the Auckland Museum search endpoint.
 * @returns The total hit count and the matching records.
 */
export function parseAucklandMuseumRecords(payload: unknown): AucklandMuseumSearchResult {
  const parsed = AUCKLAND_MUSEUM_RESPONSE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError('Auckland Museum', parsed.error.message);
  }
  const total = parsed.data.hits.total;
  return {
    total: typeof total === 'number' ? total : total.value,
    records: parsed.data.hits.hits.map(toRecord),
  };
}

/**
 * Searches Auckland Museum's collections online index. Keyless; the museum
 * removed API keys for version 2 of the API.
 *
 * @param query - Free-text search, such as "ice axe edmund hillary".
 * @param size - Maximum records to return, up to 20 by default.
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns The total hit count and the matching records.
 */
export async function searchAucklandMuseumRecords(
  query: string,
  size = 20,
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<AucklandMuseumSearchResult> {
  const url = new URL('https://api.aucklandmuseum.com/search/collectionsonline/_search');
  url.searchParams.set('q', query);
  url.searchParams.set('size', String(size));
  const response = await httpGet('Auckland Museum', url, {
    fetchImpl,
    headers: { Accept: 'application/json' },
  });
  return parseAucklandMuseumRecords(await response.json());
}

/** Auckland Museum adapter: collections online search, keyless. */
export const aucklandMuseumAdapter: NzDataAdapter<AucklandMuseumSearchResult> = {
  id: AUCKLAND_MUSEUM_SOURCE_ID,
  name: 'Auckland Museum',
  auth: 'none',
  description: 'Search Auckland Museum collections online records and linked media.',
  fetchLive: (options) =>
    searchAucklandMuseumRecords('ice axe edmund hillary', 20, options?.fetchImpl),
  parse: parseAucklandMuseumRecords,
  loadFixture: () =>
    parseAucklandMuseumRecords(readFixtureJson('auckland-museum-ice-axe-2026-11-16.json')),
};
