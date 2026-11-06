import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  MBIE_OPEN_DATA_SOURCE_ID,
  fetchMbieOpenDataDatasets,
  mbieOpenDataAdapter,
  parseMbieOpenDataDatasets,
} from './mbieOpenData.js';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/mbie-open-data-2026-11-07.json'), 'utf8')
) as unknown;

const FIXTURE_DATASET_COUNT = 34;
const SEARCH_URL =
  'https://catalogue.data.govt.nz/api/3/action/package_search?fq=organization%3Aministry-of-business-innovation-and-employment&rows=1000';

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseMbieOpenDataDatasets', () => {
  it('parses the MBIE catalogue fixture into datasets', () => {
    const result = parseMbieOpenDataDatasets(FIXTURE);
    expect(result.count).toBe(FIXTURE_DATASET_COUNT);
    expect(result.datasets).toHaveLength(FIXTURE_DATASET_COUNT);
    const first = result.datasets[0];
    expect(first?.title).toBe('Weekly fuel stock updates');
    expect(first?.name).toBe('weekly-fuel-stock-updates');
    expect(first?.licenseId).toBe('CC-BY-4.0');
    expect(first?.licenseTitle).toBe('Creative Commons Attribution 4.0 International');
    expect(first?.licenseUrl).toBe('https://creativecommons.org/licenses/by/4.0/');
    expect(first?.author).toBe('MBIE fuel response data');
    expect(first?.organization).toBe('Ministry of Business, Innovation and Employment');
    expect(first?.rights).toBe('');
  });

  it('keeps the source rights link when the licence is other', () => {
    const result = parseMbieOpenDataDatasets(FIXTURE);
    const companiesOffice = result.datasets.find(
      (dataset) => dataset.name === 'the-companies-office'
    );
    expect(companiesOffice?.licenseId).toBe('other');
    expect(companiesOffice?.rights).toBe(
      'https://support.api.business.govt.nz/s/article/terms-and-conditions'
    );
  });

  it('keeps the downloadable resources and their formats', () => {
    const result = parseMbieOpenDataDatasets(FIXTURE);
    const first = result.datasets[0];
    expect(first?.resources).toHaveLength(3);
    expect(first?.resources[0]?.format).toBe('CSV');
    expect(first?.resources[0]?.url).toContain('petrol-days-of-supply.csv');
  });

  it('returns MBIE datasets with the older NZ licence as well', () => {
    const result = parseMbieOpenDataDatasets(FIXTURE);
    const quarterly = result.datasets.find((dataset) => dataset.name === 'energy-quarterly');
    expect(quarterly?.licenseId).toBe('CC-BY-NZ-3.0');
    expect(quarterly?.licenseUrl).toBe('https://creativecommons.org/licenses/by/3.0/nz/');
  });

  it('rejects a failed CKAN response', () => {
    expect(() => parseMbieOpenDataDatasets({ success: false })).toThrow(NzSourceParseError);
  });
});

describe('fetchMbieOpenDataDatasets', () => {
  it('fetches and parses the MBIE catalogue response', async () => {
    const result = await fetchMbieOpenDataDatasets(stubFetch);
    expect(result.count).toBe(FIXTURE_DATASET_COUNT);
  });

  it('filters the national catalogue to the MBIE organisation', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchMbieOpenDataDatasets(fetchImpl);
    expect(requestedUrl).toBe(SEARCH_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchMbieOpenDataDatasets(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('mbieOpenDataAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(mbieOpenDataAdapter.id).toBe(MBIE_OPEN_DATA_SOURCE_ID);
    expect(mbieOpenDataAdapter.id).toBe('mbie-open-data');
    expect(mbieOpenDataAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    const result = mbieOpenDataAdapter.loadFixture();
    expect(result.count).toBe(FIXTURE_DATASET_COUNT);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const result = await mbieOpenDataAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(result.datasets).toHaveLength(FIXTURE_DATASET_COUNT);
  });
});
