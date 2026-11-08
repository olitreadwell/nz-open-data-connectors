import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  NZPAM_GEODATA_SOURCE_ID,
  fetchNzpamGeodataServices,
  nzpamGeodataAdapter,
  parseNzpamGeodataServices,
} from './nzpamGeodata.js';

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'src/fixtures/nzpam-geodata-services-2026-11-08.json'),
    'utf8'
  )
) as unknown;

const FIXTURE_SERVICE_COUNT = 13;
const SERVICES_URL = 'https://gis.nzpam.govt.nz/server/rest/services/Public?f=pjson';

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseNzpamGeodataServices', () => {
  it('parses the public ArcGIS folder into services', () => {
    const catalogue = parseNzpamGeodataServices(FIXTURE);
    expect(catalogue.currentVersion).toBe('11.5');
    expect(catalogue.folders).toEqual([]);
    expect(catalogue.services).toHaveLength(FIXTURE_SERVICE_COUNT);
    expect(catalogue.services[0]).toEqual({
      name: 'Public/CMA_Minerals_Excluded_Land',
      type: 'MapServer',
    });
    expect(catalogue.services.some((service) => service.type === 'FeatureServer')).toBe(true);
  });

  it('rejects a payload without a service list', () => {
    expect(() => parseNzpamGeodataServices({ currentVersion: '11.5' })).toThrow(NzSourceParseError);
  });
});

describe('fetchNzpamGeodataServices', () => {
  it('fetches the public ArcGIS folder and parses it', async () => {
    const catalogue = await fetchNzpamGeodataServices(stubFetch);
    expect(catalogue.services).toHaveLength(FIXTURE_SERVICE_COUNT);
  });

  it('requests the public ArcGIS services folder', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchNzpamGeodataServices(fetchImpl);
    expect(requestedUrl).toBe(SERVICES_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchNzpamGeodataServices(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('nzpamGeodataAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(nzpamGeodataAdapter.id).toBe(NZPAM_GEODATA_SOURCE_ID);
    expect(nzpamGeodataAdapter.id).toBe('nzpam-geodata');
    expect(nzpamGeodataAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    const catalogue = nzpamGeodataAdapter.loadFixture();
    expect(catalogue.services).toHaveLength(FIXTURE_SERVICE_COUNT);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const catalogue = await nzpamGeodataAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(catalogue.services).toHaveLength(FIXTURE_SERVICE_COUNT);
  });
});
