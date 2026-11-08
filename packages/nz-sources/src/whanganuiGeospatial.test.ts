import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import {
  WHANGANUI_GEOSPATIAL_SOURCE_ID,
  fetchWhanganuiGeoNodeDatasets,
  parseWhanganuiGeoNodeDatasets,
  whanganuiGeospatialAdapter,
} from './whanganuiGeospatial.js';

const FIXTURE = readFixtureJson('whanganui-geonode-datasets-2026-11-08.json');
const DATASETS_URL = 'https://geonode.whanganui.govt.nz/api/v2/datasets/?page_size=100';

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseWhanganuiGeoNodeDatasets', () => {
  it('parses the Whanganui GeoNode fixture', () => {
    const result = parseWhanganuiGeoNodeDatasets(FIXTURE);
    expect(result.total).toBe(257);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(100);
    expect(result.datasets).toHaveLength(100);
  });

  it('keeps dataset identity, extent, owner and licence', () => {
    const first = parseWhanganuiGeoNodeDatasets(FIXTURE).datasets[0];
    expect(first?.key).toBe('686');
    expect(first?.name).toBe('address');
    expect(first?.title).toBe('Addresses DEPRECATED');
    expect(first?.subtype).toBe('vector');
    expect(first?.licenseIdentifier).toBe('not_specified');
    expect(first?.extent?.coords).toHaveLength(4);
    expect(first?.extent?.srid).toBe('EPSG:4326');
    expect(first?.ownerEmail).toBe('gis@whanganui.govt.nz');
  });

  it('normalizes a null licence to an empty identifier', () => {
    const layers = parseWhanganuiGeoNodeDatasets(FIXTURE).datasets;
    const withoutLicence = layers.find((layer) => layer.name === 'catchment_managment_areas');
    expect(withoutLicence?.licenseIdentifier).toBe('');
  });

  it('rejects a payload without a dataset list', () => {
    expect(() => parseWhanganuiGeoNodeDatasets({ total: 0 })).toThrow(NzSourceParseError);
  });
});

describe('fetchWhanganuiGeoNodeDatasets', () => {
  it('fetches and parses the first page of datasets', async () => {
    const result = await fetchWhanganuiGeoNodeDatasets(stubFetch);
    expect(result.datasets).toHaveLength(100);
  });

  it('requests the GeoNode dataset list with a 100 row page', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchWhanganuiGeoNodeDatasets(fetchImpl);
    expect(requestedUrl).toBe(DATASETS_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as typeof fetch;
    await expect(fetchWhanganuiGeoNodeDatasets(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('whanganuiGeospatialAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(whanganuiGeospatialAdapter.id).toBe(WHANGANUI_GEOSPATIAL_SOURCE_ID);
    expect(whanganuiGeospatialAdapter.id).toBe('whanganui-geospatial');
    expect(whanganuiGeospatialAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(whanganuiGeospatialAdapter.loadFixture().total).toBe(257);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const result = await whanganuiGeospatialAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(result.datasets[0]?.name).toBe('address');
  });
});
