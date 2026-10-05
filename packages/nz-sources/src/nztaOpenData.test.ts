import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  NZTA_OPEN_DATA_SOURCE_ID,
  fetchNztaOpenDataCatalogue,
  nztaOpenDataAdapter,
  parseNztaOpenDataCatalogue,
} from './nztaOpenData.js';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/nzta-open-data-2026-10-05.json'), 'utf8')
) as unknown;

const FIXTURE_DATASET_COUNT = 36;
const FEED_URL = 'https://opendata-nzta.opendata.arcgis.com/api/feed/dcat-us/1.1.json';

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseNztaOpenDataCatalogue', () => {
  it('parses the NZTA DCAT fixture into catalogue datasets', () => {
    const catalogue = parseNztaOpenDataCatalogue(FIXTURE);
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
    expect(catalogue.datasets).toHaveLength(FIXTURE_DATASET_COUNT);
    const first = catalogue.datasets[0];
    expect(first?.title).toBe('EV Roam charging stations');
    expect(first?.identifier).toContain('arcgis.com/home/item.html');
    expect(first?.publisher).toBe('Waka Kotahi');
    expect(first?.contactEmail).toBe('spatial@nzta.govt.nz');
    expect(first?.keywords).toEqual(['EV']);
    expect(first?.distributions.length).toBeGreaterThan(0);
    expect(first?.distributions[0]?.format).toBe('Web Page');
  });

  it('lists GeoJSON distributions and normalizes themes', () => {
    const catalogue = parseNztaOpenDataCatalogue(FIXTURE);
    const geoJson = catalogue.datasets.flatMap((dataset) =>
      dataset.distributions.filter((distribution) => distribution.format === 'GeoJSON')
    );
    expect(geoJson[0]?.mediaType).toBe('application/vnd.geo+json');
    expect(catalogue.datasets.some((dataset) => dataset.themes.includes('geospatial'))).toBe(true);
    expect(catalogue.datasets.some((dataset) => dataset.themes.length === 0)).toBe(true);
  });

  it('rejects a payload without a dataset list', () => {
    expect(() => parseNztaOpenDataCatalogue({ '@type': 'dcat:Catalog' })).toThrow(
      NzSourceParseError
    );
  });
});

describe('fetchNztaOpenDataCatalogue', () => {
  it('fetches the DCAT feed and parses it', async () => {
    const catalogue = await fetchNztaOpenDataCatalogue(stubFetch);
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
  });

  it('requests the DCAT US 1.1 catalogue feed', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchNztaOpenDataCatalogue(fetchImpl);
    expect(requestedUrl).toBe(FEED_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchNztaOpenDataCatalogue(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('nztaOpenDataAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(nztaOpenDataAdapter.id).toBe(NZTA_OPEN_DATA_SOURCE_ID);
    expect(nztaOpenDataAdapter.id).toBe('nzta-open-data');
    expect(nztaOpenDataAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    const catalogue = nztaOpenDataAdapter.loadFixture();
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const catalogue = await nztaOpenDataAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
  });
});
