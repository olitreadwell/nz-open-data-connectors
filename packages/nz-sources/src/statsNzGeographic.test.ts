import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import {
  STATS_NZ_GEOGRAPHIC_SOURCE_ID,
  fetchStatsNzGeographicLayers,
  parseStatsNzGeographicLayers,
  searchStatsNzGeographicLayers,
  statsNzGeographicAdapter,
} from './statsNzGeographic.js';

const FIXTURE = readFixtureJson('stats-nz-geographic-meshblock-2026-11-08.json');
const SEARCH_URL = 'https://datafinder.stats.govt.nz/services/api/v1/layers?search=meshblock';

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseStatsNzGeographicLayers', () => {
  it('parses the Stats NZ Geographic Data Service fixture', () => {
    const layers = parseStatsNzGeographicLayers(FIXTURE);
    expect(layers).toHaveLength(100);
  });

  it('keeps layer identity, publication dates and access level', () => {
    const first = parseStatsNzGeographicLayers(FIXTURE)[0];
    expect(first?.id).toBe(122741);
    expect(first?.title).toBe('General Electorates 2025');
    expect(first?.type).toBe('layer');
    expect(first?.publicAccess).toBe('download');
    expect(first?.featuredAt).toBeNull();
    expect(first?.publishedAt).toMatch(/Z$/);
  });

  it('keeps a non-null featured date when the source supplies one', () => {
    const featured = parseStatsNzGeographicLayers(FIXTURE).find(
      (layer) => layer.featuredAt !== null
    );
    expect(featured?.featuredAt).toMatch(/Z$/);
  });

  it('rejects a payload that is not a layer list', () => {
    expect(() => parseStatsNzGeographicLayers({ results: [] })).toThrow(NzSourceParseError);
  });
});

describe('searchStatsNzGeographicLayers', () => {
  it('fetches and parses the layer search', async () => {
    const layers = await searchStatsNzGeographicLayers('meshblock', stubFetch);
    expect(layers).toHaveLength(100);
  });

  it('requests the datafinder layer search URL', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await searchStatsNzGeographicLayers('meshblock', fetchImpl);
    expect(requestedUrl).toBe(SEARCH_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(searchStatsNzGeographicLayers('meshblock', fetchImpl)).rejects.toThrow(
      NzSourceApiError
    );
  });
});

describe('fetchStatsNzGeographicLayers', () => {
  it('defaults to the meshblock search', async () => {
    const layers = await fetchStatsNzGeographicLayers(stubFetch);
    expect(layers[0]?.id).toBe(122741);
  });
});

describe('statsNzGeographicAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(statsNzGeographicAdapter.id).toBe(STATS_NZ_GEOGRAPHIC_SOURCE_ID);
    expect(statsNzGeographicAdapter.id).toBe('stats-nz-geographic');
    expect(statsNzGeographicAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(statsNzGeographicAdapter.loadFixture()).toHaveLength(100);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const layers = await statsNzGeographicAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(layers[0]?.title).toBe('General Electorates 2025');
  });
});
