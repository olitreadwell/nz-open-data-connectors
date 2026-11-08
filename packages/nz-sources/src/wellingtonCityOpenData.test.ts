import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  WELLINGTON_CITY_OPEN_DATA_SOURCE_ID,
  fetchWellingtonCityOpenDataCatalogue,
  parseWellingtonCityOpenDataCatalogue,
  wellingtonCityOpenDataAdapter,
} from './wellingtonCityOpenData.js';

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'src/fixtures/wellington-city-open-data-2026-11-08.json'),
    'utf8'
  )
) as unknown;

const FIXTURE_DATASET_COUNT = 481;
const FEED_URL = 'https://data-wcc.opendata.arcgis.com/api/feed/dcat-us/1.1.json';

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseWellingtonCityOpenDataCatalogue', () => {
  it('parses the Wellington City DCAT fixture into catalogue datasets', () => {
    const catalogue = parseWellingtonCityOpenDataCatalogue(FIXTURE);
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
    expect(catalogue.datasets).toHaveLength(FIXTURE_DATASET_COUNT);
    const first = catalogue.datasets[0];
    expect(first?.title).toBe('Heritage Trees');
    expect(first?.publisher).toBe('Wellington City Council');
    expect(first?.contactEmail).toContain('GISOperationsTeam@wcc.govt.nz');
    expect(first?.license).toContain('Creative Commons 3.0 (NZ)');
    expect(first?.themes).toEqual(['geospatial']);
  });

  it('rejects a payload without a dataset list', () => {
    expect(() => parseWellingtonCityOpenDataCatalogue({ '@type': 'dcat:Catalog' })).toThrow(
      NzSourceParseError
    );
  });
});

describe('fetchWellingtonCityOpenDataCatalogue', () => {
  it('fetches the DCAT feed and parses it', async () => {
    const catalogue = await fetchWellingtonCityOpenDataCatalogue(stubFetch);
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
  });

  it('requests the DCAT US 1.1 catalogue feed', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchWellingtonCityOpenDataCatalogue(fetchImpl);
    expect(requestedUrl).toBe(FEED_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchWellingtonCityOpenDataCatalogue(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('wellingtonCityOpenDataAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(wellingtonCityOpenDataAdapter.id).toBe(WELLINGTON_CITY_OPEN_DATA_SOURCE_ID);
    expect(wellingtonCityOpenDataAdapter.id).toBe('wellington-city-open-data');
    expect(wellingtonCityOpenDataAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    const catalogue = wellingtonCityOpenDataAdapter.loadFixture();
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const catalogue = await wellingtonCityOpenDataAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
  });
});
