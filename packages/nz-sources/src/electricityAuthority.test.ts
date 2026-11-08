import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  ELECTRICITY_AUTHORITY_SOURCE_ID,
  electricityAuthorityAdapter,
  fetchElectricityAuthorityDatasets,
  parseElectricityAuthorityDatasets,
} from './electricityAuthority.js';
import { readFixtureText } from './fixtures.js';

const FIXTURE = readFixtureText('electricity-authority-datasets-2026-11-08.xml');
const FIXTURE_BLOB_COUNT = 3941;
const FIRST_CSV_BYTES = 72963;
const LIST_URL = 'https://emidatasets.blob.core.windows.net/publicdata?restype=container&comp=list';

const stubFetch = (async () => new Response(FIXTURE, { status: 200 })) as typeof fetch;

describe('parseElectricityAuthorityDatasets', () => {
  it('parses the Azure container listing into dataset objects', () => {
    const result = parseElectricityAuthorityDatasets(FIXTURE);
    expect(result.container).toBe('https://emidatasets.blob.core.windows.net/publicdata');
    expect(result.objects).toHaveLength(FIXTURE_BLOB_COUNT);
    expect(result.nextMarker).toMatch(/^2!256!/);
    const first = result.objects[0];
    expect(first?.name).toBe('Datasets');
    expect(first?.url).toBe('https://emidatasets.blob.core.windows.net/publicdata/Datasets');
    expect(first?.contentLength).toBe(0);
    expect(first?.contentType).toBe('application/octet-stream');
  });

  it('keeps the first CSV object and its byte length', () => {
    const result = parseElectricityAuthorityDatasets(FIXTURE);
    const csv = result.objects.find((object) => object.name.endsWith('.csv'));
    expect(csv?.name).toBe(
      'Datasets/Environment/HydrologicalModellingDataset/1_InfrastructureAndHydroConstraintAttributes/20241231_InfrastructureAndHydroConstraintAttributes.csv'
    );
    expect(csv?.contentLength).toBe(FIRST_CSV_BYTES);
  });

  it('rejects a payload without a container listing root', () => {
    expect(() => parseElectricityAuthorityDatasets('<not-a-listing />')).toThrow(
      NzSourceParseError
    );
  });
});

describe('fetchElectricityAuthorityDatasets', () => {
  it('fetches the public container listing and parses it', async () => {
    const result = await fetchElectricityAuthorityDatasets(stubFetch);
    expect(result.objects).toHaveLength(FIXTURE_BLOB_COUNT);
  });

  it('requests the public container listing', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(FIXTURE, { status: 200 });
    }) as typeof fetch;
    await fetchElectricityAuthorityDatasets(fetchImpl);
    expect(requestedUrl).toBe(LIST_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchElectricityAuthorityDatasets(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('electricityAuthorityAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(electricityAuthorityAdapter.id).toBe(ELECTRICITY_AUTHORITY_SOURCE_ID);
    expect(electricityAuthorityAdapter.id).toBe('electricity-authority');
    expect(electricityAuthorityAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    const result = electricityAuthorityAdapter.loadFixture();
    expect(result.objects).toHaveLength(FIXTURE_BLOB_COUNT);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const result = await electricityAuthorityAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(result.objects).toHaveLength(FIXTURE_BLOB_COUNT);
  });
});
