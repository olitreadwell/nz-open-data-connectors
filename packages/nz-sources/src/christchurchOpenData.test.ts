import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import {
  CHRISTCHURCH_OPEN_DATA_SOURCE_ID,
  christchurchOpenDataAdapter,
  fetchChristchurchOpenDataCatalogue,
  parseChristchurchOpenDataCatalogue,
} from './christchurchOpenData.js';

const FIXTURE = readFixtureJson('christchurch-open-data-2026-11-08.json');
const FEED_URL = 'https://opendata-christchurchcity.hub.arcgis.com/api/feed/dcat-us/1.1.json';

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseChristchurchOpenDataCatalogue', () => {
  it('parses the Christchurch City DCAT fixture', () => {
    const catalogue = parseChristchurchOpenDataCatalogue(FIXTURE);
    expect(catalogue.count).toBe(478);
    expect(catalogue.datasets).toHaveLength(478);
  });

  it('keeps dataset identity, publisher, licence and distributions', () => {
    const catalogue = parseChristchurchOpenDataCatalogue(FIXTURE);
    const dataset = catalogue.datasets.find((item) =>
      item.title.startsWith('Ww Local Pressure Pump Zone')
    );
    expect(dataset?.publisher).toBe('Christchurch City Council');
    expect(dataset?.license).toContain('creativecommons.org/licenses/by/4.0');
    expect(dataset?.themes.length).toBeGreaterThan(0);
    expect(dataset?.distributions.length).toBeGreaterThan(0);
  });

  it('rejects a payload without a dataset list', () => {
    expect(() => parseChristchurchOpenDataCatalogue({ '@type': 'dcat:Catalog' })).toThrow(
      NzSourceParseError
    );
  });
});

describe('fetchChristchurchOpenDataCatalogue', () => {
  it('fetches the DCAT feed and parses it', async () => {
    const catalogue = await fetchChristchurchOpenDataCatalogue(stubFetch);
    expect(catalogue.count).toBe(478);
  });

  it('requests the Christchurch DCAT 1.1 feed', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchChristchurchOpenDataCatalogue(fetchImpl);
    expect(requestedUrl).toBe(FEED_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchChristchurchOpenDataCatalogue(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('christchurchOpenDataAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(christchurchOpenDataAdapter.id).toBe(CHRISTCHURCH_OPEN_DATA_SOURCE_ID);
    expect(christchurchOpenDataAdapter.id).toBe('christchurch-open-data');
    expect(christchurchOpenDataAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(christchurchOpenDataAdapter.loadFixture().count).toBe(478);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const catalogue = await christchurchOpenDataAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(catalogue.count).toBe(478);
  });
});
