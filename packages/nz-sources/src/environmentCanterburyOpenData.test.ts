import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import { readFixtureJson, readFixtureText } from './fixtures.js';
import {
  ENVIRONMENT_CANTERBURY_OPEN_DATA_SOURCE_ID,
  environmentCanterburyOpenDataAdapter,
  fetchEcanDatasetCatalogue,
  fetchEcanDatasetRows,
  parseEcanCataloguePage,
  parseEcanDatasetRows,
} from './environmentCanterburyOpenData.js';

const CATALOGUE_HTML = readFixtureText(
  'environment-canterbury-open-data-catalogue-2026-11-18.html'
);
const AIR_QUALITY_SITES = readFixtureJson(
  'environment-canterbury-open-data-air-quality-sites-2026-11-18.json'
);

const stubPageFetch = (async () =>
  new Response(CATALOGUE_HTML, {
    status: 200,
    headers: { 'content-type': 'text/html' },
  })) as typeof fetch;

describe('parseEcanCataloguePage', () => {
  it('parses the committed catalogue fixture', () => {
    const page = parseEcanCataloguePage(CATALOGUE_HTML);
    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(10);
    expect(page.total).toBe(60);
    expect(page.lastPage).toBe(6);
    expect(page.datasets).toHaveLength(10);
  });

  it('keeps dataset identity, formats, keywords and description', () => {
    const page = parseEcanCataloguePage(CATALOGUE_HTML);
    const dataset = page.datasets[0];
    expect(dataset?.methodId).toBe(171);
    expect(dataset?.title).toBe('Air contaminants for a monitored site (hourly)');
    expect(dataset?.formats).toEqual(['CSV', 'XML', 'JSON', 'JSONP']);
    expect(dataset?.keywords).toEqual(['Air', 'Air Quality', 'Data Pipeline']);
    expect(dataset?.description).toContain('contaminant data');
    expect(dataset?.url).toBe('https://data.ecan.govt.nz/Catalogue/Method?MethodId=171');
  });

  it('rejects a payload that is not HTML text', () => {
    expect(() => parseEcanCataloguePage({ results: [] })).toThrow(NzSourceParseError);
  });

  it('rejects HTML that is not a catalogue results page', () => {
    expect(() => parseEcanCataloguePage('<html><body>Not found</body></html>')).toThrow(
      NzSourceParseError
    );
  });

  it('rejects a result count with no dataset entries', () => {
    const html = CATALOGUE_HTML.replace(/<div class="rollup">[\s\S]*<\/div><\/div>/g, '');
    expect(() => parseEcanCataloguePage(html)).toThrow(NzSourceParseError);
  });
});

describe('fetchEcanDatasetCatalogue', () => {
  it('follows every catalogue page and deduplicates datasets by method id', async () => {
    const requestedPages: string[] = [];
    const fetchImpl = (async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      requestedPages.push(new URL(url).searchParams.get('page') ?? '');
      return new Response(CATALOGUE_HTML, { status: 200 });
    }) as typeof fetch;

    const catalogue = await fetchEcanDatasetCatalogue({ fetchImpl });

    expect(requestedPages).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(catalogue.total).toBe(60);
    expect(catalogue.datasets).toHaveLength(10);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchEcanDatasetCatalogue({ fetchImpl })).rejects.toThrow(NzSourceApiError);
  });
});

describe('parseEcanDatasetRows', () => {
  it('parses the committed air quality sites fixture', () => {
    const rows = parseEcanDatasetRows(AIR_QUALITY_SITES);
    expect(rows).toHaveLength(18);
    expect(rows[0]).toMatchObject({
      SiteNo: '7',
      SiteName: 'Ashburton',
      City: 'Ashburton',
      AirShed: 'Ashburton',
    });
  });

  it('rejects the removed-service message instead of returning fake rows', () => {
    const removed = {
      data: {
        item: { Msg: 'This data service has become out of date and has now been removed.' },
      },
    };
    expect(() => parseEcanDatasetRows(removed)).toThrow(NzSourceParseError);
  });
});

describe('fetchEcanDatasetRows', () => {
  it('requests the dataset JSON export', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(AIR_QUALITY_SITES), { status: 200 });
    }) as typeof fetch;

    const rows = await fetchEcanDatasetRows(23, { fetchImpl });

    expect(requestedUrl).toBe('https://data.ecan.govt.nz/data/23/JSON');
    expect(rows).toHaveLength(18);
  });
});

describe('environmentCanterburyOpenDataAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(environmentCanterburyOpenDataAdapter.id).toBe(
      ENVIRONMENT_CANTERBURY_OPEN_DATA_SOURCE_ID
    );
    expect(environmentCanterburyOpenDataAdapter.id).toBe('environment-canterbury-open-data');
    expect(environmentCanterburyOpenDataAdapter.auth).toBe('none');
  });

  it('loads the committed catalogue fixture', () => {
    const page = environmentCanterburyOpenDataAdapter.loadFixture();
    expect(page.total).toBe(60);
    expect(page.datasets).toHaveLength(10);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const page = await environmentCanterburyOpenDataAdapter.fetchLive({
      fetchImpl: stubPageFetch,
    });
    expect(page.total).toBe(60);
    expect(page.datasets[0]?.methodId).toBe(171);
  });
});
