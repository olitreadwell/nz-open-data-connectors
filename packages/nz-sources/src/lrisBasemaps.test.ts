import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import { readFixtureText } from './fixtures.js';
import {
  LRIS_BASEMAPS_SOURCE_ID,
  fetchLrisBasemaps,
  lrisBasemapsAdapter,
  parseLrisBasemaps,
} from './lrisBasemaps.js';

const FIXTURE = readFixtureText('lris-basemaps-wms-2026-11-08.xml');
const CAPABILITIES_URL =
  'https://maps.scinfo.org.nz/basemaps/wms?service=WMS&request=GetCapabilities';

const stubFetch = (async () => new Response(FIXTURE, { status: 200 })) as typeof fetch;

describe('parseLrisBasemaps', () => {
  it('parses the LRIS WMS capabilities fixture', () => {
    const capabilities = parseLrisBasemaps(FIXTURE);
    expect(capabilities.version).toBe('1.3.0');
    expect(capabilities.serviceTitle).toBe('Landcare Research NZ Topographic Baselayer');
    expect(capabilities.layers).toHaveLength(12);
  });

  it('keeps the named topographic layers and their declared metadata', () => {
    const capabilities = parseLrisBasemaps(FIXTURE);
    const first = capabilities.layers[0];
    expect(first?.name).toBe('ext_basemap');
    expect(first?.title).toBe('Landcare Research NZ Topographic Baselayer');
    expect(first?.queryable).toBe(false);
    expect(first?.crs).toContain('EPSG:2193');
    expect(first?.geographicBounds?.west).toBeCloseTo(164.843);
    expect(first?.geographicBounds?.south).toBeCloseTo(-47.5944);
    expect(capabilities.layers.some((layer) => layer.name === 'topobasemap')).toBe(true);
  });

  it('rejects a payload without a WMS root element', () => {
    expect(() => parseLrisBasemaps('<not-wms />')).toThrow(NzSourceParseError);
  });
});

describe('fetchLrisBasemaps', () => {
  it('fetches the capabilities document and parses it', async () => {
    const capabilities = await fetchLrisBasemaps(stubFetch);
    expect(capabilities.layers).toHaveLength(12);
  });

  it('requests the LRIS basemaps GetCapabilities URL', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(FIXTURE, { status: 200 });
    }) as typeof fetch;
    await fetchLrisBasemaps(fetchImpl);
    expect(requestedUrl).toBe(CAPABILITIES_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchLrisBasemaps(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('lrisBasemapsAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(lrisBasemapsAdapter.id).toBe(LRIS_BASEMAPS_SOURCE_ID);
    expect(lrisBasemapsAdapter.id).toBe('lris-basemaps');
    expect(lrisBasemapsAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(lrisBasemapsAdapter.loadFixture().layers).toHaveLength(12);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const capabilities = await lrisBasemapsAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(capabilities.serviceTitle).toBe('Landcare Research NZ Topographic Baselayer');
  });
});
