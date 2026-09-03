import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  arcgisHubAdapter,
  fetchArcgisHubCollections,
  normalizeArcgisHubHost,
  parseArcgisHubCollections,
  parseArcgisHubDatasets,
  searchArcgisHubDatasets,
} from './arcgisHub';
import { NzSourceApiError, NzSourceParseError } from './errors';

const FIXTURES_DIR = path.join(process.cwd(), 'src/fixtures');

const COLLECTION_FIXTURES = [
  'arcgis-hub-data-aucklandcouncil.opendata.arcgis.com-collections-2026-08-25.json',
  'arcgis-hub-data-wcc.opendata.arcgis.com-collections-2026-08-25.json',
  'arcgis-hub-opendata.canterburymaps.govt.nz-collections-2026-08-25.json',
  'arcgis-hub-opendata-nzta.opendata.arcgis.com-collections-2026-08-25.json',
];

const DATASETS_FIXTURE =
  'arcgis-hub-data-aucklandcouncil.opendata.arcgis.com-datasets-parks-2026-08-25.json';

const UNAUTHORIZED_STATUS = 401;
const NOT_FOUND_STATUS = 404;

function readFixture(filename: string): unknown {
  return JSON.parse(readFileSync(path.join(FIXTURES_DIR, filename), 'utf8'));
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseArcgisHubCollections', () => {
  it.each(COLLECTION_FIXTURES)('parses the %s fixture into collections', (filename) => {
    const collections = parseArcgisHubCollections(readFixture(filename));
    expect(collections.length).toBeGreaterThan(0);
    for (const collection of collections) {
      expect(collection.id.length).toBeGreaterThan(0);
      expect(collection.title.length).toBeGreaterThan(0);
    }
  });

  it('rejects a payload without a collections list', () => {
    expect(() => parseArcgisHubCollections({ items: [] })).toThrow(NzSourceParseError);
  });
});

describe('parseArcgisHubDatasets', () => {
  it('parses the Auckland parks fixture into datasets', () => {
    const datasets = parseArcgisHubDatasets(readFixture(DATASETS_FIXTURE));
    expect(datasets.length).toBeGreaterThan(0);
    const first = datasets[0];
    expect(first?.id.length).toBeGreaterThan(0);
    expect(first?.title.length).toBeGreaterThan(0);
    expect(first?.url.length).toBeGreaterThan(0);
    expect(first?.tags.length).toBeGreaterThan(0);
    const parkExtents = datasets.find((dataset) => dataset.title === 'Park Extents');
    expect(parkExtents?.source).toBe('Auckland Council');
  });

  it('rejects a payload without features', () => {
    expect(() => parseArcgisHubDatasets({ type: 'FeatureCollection' })).toThrow(NzSourceParseError);
  });
});

describe('fetchArcgisHubCollections', () => {
  it('fetches and parses collections from a host', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixture(COLLECTION_FIXTURES[0] ?? '')))
    );
    const collections = await fetchArcgisHubCollections({
      host: 'data-aucklandcouncil.opendata.arcgis.com',
    });
    expect(collections.length).toBeGreaterThan(0);
  });

  it('throws NzSourceApiError on a 401 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, UNAUTHORIZED_STATUS))
    );
    await expect(
      fetchArcgisHubCollections({ host: 'https://invalid.example.com' })
    ).rejects.toThrow(NzSourceApiError);
  });
});

describe('searchArcgisHubDatasets', () => {
  it('searches datasets with a query', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixture(DATASETS_FIXTURE)))
    );
    const datasets = await searchArcgisHubDatasets('parks');
    expect(datasets.length).toBeGreaterThan(0);
  });

  it('throws NzSourceApiError on a 404 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, NOT_FOUND_STATUS))
    );
    await expect(searchArcgisHubDatasets('parks')).rejects.toThrow(NzSourceApiError);
  });
});

describe('arcgisHubAdapter', () => {
  it('probes the collections endpoint when no query is given', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixture(COLLECTION_FIXTURES[0] ?? '')))
    );
    const result = await arcgisHubAdapter.fetchLive();
    expect(result.kind).toBe('collections');
    if (result.kind === 'collections') {
      expect(result.collections.length).toBeGreaterThan(0);
    }
  });

  it('searches datasets when a query is given', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixture(DATASETS_FIXTURE)))
    );
    const result = await arcgisHubAdapter.fetchLive({ q: 'parks' });
    expect(result.kind).toBe('datasets');
    if (result.kind === 'datasets') {
      expect(result.datasets.length).toBeGreaterThan(0);
    }
  });

  it('passes host and fetchImpl through to the collections fetch', async () => {
    const fetchMock = vi.fn<typeof globalThis.fetch>(async () =>
      jsonResponse(readFixture(COLLECTION_FIXTURES[0] ?? ''))
    );
    const result = await arcgisHubAdapter.fetchLive({
      host: 'https://data-wcc.opendata.arcgis.com',
      fetchImpl: fetchMock,
    });
    expect(result.kind).toBe('collections');
    const calledUrl = fetchMock.mock.calls[0]?.[0];
    expect(typeof calledUrl).toBe('string');
    expect(calledUrl).toBe('https://data-wcc.opendata.arcgis.com/api/search/v1/collections');
  });

  it('loads the committed datasets fixture', () => {
    const result = arcgisHubAdapter.loadFixture();
    expect(result.kind).toBe('datasets');
  });

  it('parses a collections payload through the adapter', () => {
    const result = arcgisHubAdapter.parse(readFixture(COLLECTION_FIXTURES[0] ?? ''));
    expect(result.kind).toBe('collections');
  });

  it('parses a datasets payload through the adapter', () => {
    const result = arcgisHubAdapter.parse(readFixture(DATASETS_FIXTURE));
    expect(result.kind).toBe('datasets');
  });
});

describe('normalizeArcgisHubHost', () => {
  it('adds https when the scheme is missing', () => {
    expect(normalizeArcgisHubHost('data-wcc.opendata.arcgis.com')).toBe(
      'https://data-wcc.opendata.arcgis.com'
    );
  });

  it('strips a trailing slash', () => {
    expect(normalizeArcgisHubHost('https://opendata.canterburymaps.govt.nz/')).toBe(
      'https://opendata.canterburymaps.govt.nz'
    );
  });
});
