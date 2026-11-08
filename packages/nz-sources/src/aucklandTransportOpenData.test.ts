import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import {
  AUCKLAND_TRANSPORT_OPEN_DATA_SOURCE_ID,
  aucklandTransportOpenDataAdapter,
  fetchAucklandTransportOpenDataCatalogue,
  parseAucklandTransportOpenDataCatalogue,
} from './aucklandTransportOpenData.js';

const FIXTURE = readFixtureJson('auckland-transport-open-data-2026-11-08.json');
const FEED_URL = 'https://data-atgis.opendata.arcgis.com/api/feed/dcat-us/1.1.json';

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseAucklandTransportOpenDataCatalogue', () => {
  it('parses the Auckland Transport DCAT fixture', () => {
    const catalogue = parseAucklandTransportOpenDataCatalogue(FIXTURE);
    expect(catalogue.count).toBe(45);
    expect(catalogue.datasets).toHaveLength(45);
  });

  it('keeps dataset identity, publisher, licence and distributions', () => {
    const catalogue = parseAucklandTransportOpenDataCatalogue(FIXTURE);
    const dataset = catalogue.datasets.find((item) => item.title === 'ParkingService');
    expect(dataset?.publisher).toBe('Auckland Transport');
    expect(dataset?.license).toBe('https://creativecommons.org/licenses/by/4.0');
    expect(dataset?.distributions.length).toBeGreaterThan(0);
  });

  it('rejects a payload without a dataset list', () => {
    expect(() => parseAucklandTransportOpenDataCatalogue({ '@type': 'dcat:Catalog' })).toThrow(
      NzSourceParseError
    );
  });
});

describe('fetchAucklandTransportOpenDataCatalogue', () => {
  it('fetches the DCAT feed and parses it', async () => {
    const catalogue = await fetchAucklandTransportOpenDataCatalogue(stubFetch);
    expect(catalogue.count).toBe(45);
  });

  it('requests the Auckland Transport DCAT 1.1 feed', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchAucklandTransportOpenDataCatalogue(fetchImpl);
    expect(requestedUrl).toBe(FEED_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchAucklandTransportOpenDataCatalogue(fetchImpl)).rejects.toThrow(
      NzSourceApiError
    );
  });
});

describe('aucklandTransportOpenDataAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(aucklandTransportOpenDataAdapter.id).toBe(AUCKLAND_TRANSPORT_OPEN_DATA_SOURCE_ID);
    expect(aucklandTransportOpenDataAdapter.id).toBe('auckland-transport-open-data');
    expect(aucklandTransportOpenDataAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(aucklandTransportOpenDataAdapter.loadFixture().count).toBe(45);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const catalogue = await aucklandTransportOpenDataAdapter.fetchLive({
      fetchImpl: stubFetch,
    });
    expect(catalogue.count).toBe(45);
  });
});
