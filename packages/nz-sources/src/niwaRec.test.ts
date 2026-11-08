import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import { readFixtureText } from './fixtures.js';
import {
  NIWA_REC_SOURCE_ID,
  fetchNiwaRecCapabilities,
  niwaRecAdapter,
  parseNiwaRecCapabilities,
} from './niwaRec.js';

const FIXTURE = readFixtureText('niwa-rec-wms-2026-11-08.xml');
const CAPABILITIES_URL = 'https://geoserver.niwa.co.nz/rec/wms?service=WMS&request=GetCapabilities';

const stubFetch = (async () => new Response(FIXTURE, { status: 200 })) as typeof fetch;

describe('parseNiwaRecCapabilities', () => {
  it('parses the NIWA REC WMS capabilities fixture', () => {
    const capabilities = parseNiwaRecCapabilities(FIXTURE);
    expect(capabilities.version).toBe('1.3.0');
    expect(capabilities.layers).toHaveLength(1);
  });

  it('keeps the named REC layer and its declared metadata', () => {
    const layer = parseNiwaRecCapabilities(FIXTURE).layers[0];
    expect(layer?.name).toBe('rivers');
    expect(layer?.title).toBe('REC2 River network');
    expect(layer?.queryable).toBe(true);
    expect(layer?.crs).toEqual(['EPSG:3857', 'CRS:84']);
    expect(layer?.geographicBounds?.west).toBeGreaterThan(0);
    expect(layer?.geographicBounds?.north).toBeGreaterThan(0);
  });

  it('rejects a payload without capability layers', () => {
    expect(() =>
      parseNiwaRecCapabilities(
        '<WMS_Capabilities version="1.3.0"><Capability /></WMS_Capabilities>'
      )
    ).toThrow(NzSourceParseError);
  });
});

describe('fetchNiwaRecCapabilities', () => {
  it('fetches the capabilities document and parses it', async () => {
    const capabilities = await fetchNiwaRecCapabilities(stubFetch);
    expect(capabilities.layers[0]?.name).toBe('rivers');
  });

  it('requests the NIWA REC GetCapabilities URL', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(FIXTURE, { status: 200 });
    }) as typeof fetch;
    await fetchNiwaRecCapabilities(fetchImpl);
    expect(requestedUrl).toBe(CAPABILITIES_URL);
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 502 })) as typeof fetch;
    await expect(fetchNiwaRecCapabilities(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('niwaRecAdapter', () => {
  it('registers the kebab-case adapter id', () => {
    expect(niwaRecAdapter.id).toBe(NIWA_REC_SOURCE_ID);
    expect(niwaRecAdapter.id).toBe('niwa-rec');
    expect(niwaRecAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(niwaRecAdapter.loadFixture().layers).toHaveLength(1);
  });

  it('fetches through the adapter fetchLive with a stubbed fetch', async () => {
    const capabilities = await niwaRecAdapter.fetchLive({ fetchImpl: stubFetch });
    expect(capabilities.layers[0]?.title).toBe('REC2 River network');
  });
});
