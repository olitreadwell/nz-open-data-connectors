import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  CANTERBURY_MAPS_SOURCE_ID,
  canterburyMapsAdapter,
  fetchCanterburyMapsCatalogue,
  parseCanterburyMapsCatalogue,
} from './canterburyMaps.js';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/canterbury-maps-2026-11-08.json'), 'utf8')
) as unknown;

const FIXTURE_DATASET_COUNT = 480;
const FEED_URL = 'https://opendata.canterburymaps.govt.nz/api/feed/dcat-us/1.1.json';

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseCanterburyMapsCatalogue', () => {
  it('parses the Canterbury Maps DCAT fixture into catalogue datasets', () => {
    const catalogue = parseCanterburyMapsCatalogue(FIXTURE);
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
    expect(catalogue.datasets).toHaveLength(FIXTURE_DATASET_COUNT);
    const first = catalogue.datasets[0];
    expect(first?.title).toBe('Effluent Dairy Discharge Area (Active) - Consented Activities');
    expect(first?.publisher).toBe('Canterbury Regional Council');
    expect(first?.contactEmail).toBe('info@canterburymaps.govt.nz');
    expect(first?.license).toBe('https://creativecommons.org/licenses/by/3.0');
    expect(first?.distributions[1]?.format).toBe('ArcGIS GeoServices REST API');
  });

  it('rejects a payload without a dataset list', () => {
    expect(() => parseCanterburyMapsCatalogue({ '@type': 'dcat:Catalog' })).toThrow(
      NzSourceParseError
    );
  });
});

describe('fetchCanterburyMapsCatalogue', () => {
  it('fetches the DCAT feed and parses it', async () => {
    const catalogue = await fetchCanterburyMapsCatalogue(stubFetch);
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
  });

  it('requests the DCAT US 1.1 catalogue feed', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchCanterburyMapsCatalogue(fetchImpl);
    expect(requestedUrl).toBe(FEED_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchCanterburyMapsCatalogue(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('canterburyMapsAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(canterburyMapsAdapter.id).toBe(CANTERBURY_MAPS_SOURCE_ID);
    expect(canterburyMapsAdapter.id).toBe('canterbury-maps');
    expect(canterburyMapsAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    const catalogue = canterburyMapsAdapter.loadFixture();
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const catalogue = await canterburyMapsAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(catalogue.count).toBe(FIXTURE_DATASET_COUNT);
  });
});
