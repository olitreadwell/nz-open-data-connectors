import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  GEONET_FELT_RAPID_SOURCE_ID,
  fetchGeoNetFeltRapid,
  geonetFeltRapidAdapter,
  parseGeoNetFeltRapid,
} from './geonetFeltRapid.js';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/geonet-felt-rapid-2026-11-16.json'), 'utf8')
) as unknown;

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseGeoNetFeltRapid', () => {
  it('parses the felt rapid GeoJSON response', () => {
    const result = parseGeoNetFeltRapid(FIXTURE);
    expect(result.count).toBe(4);
    expect(result.byMmi).toEqual({ '4': 1, '3': 3 });
    expect(result.points).toHaveLength(4);
    expect(result.points[0]).toMatchObject({ mmi: 3, count: 1 });
  });

  it('keeps longitude and latitude in GeoJSON order', () => {
    const result = parseGeoNetFeltRapid(FIXTURE);
    expect(result.points[0]?.longitude).toBeCloseTo(172.578735, 5);
    expect(result.points[0]?.latitude).toBeCloseTo(-43.525085, 5);
  });

  it('derives MMI totals when the response omits them', () => {
    const payload = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [174, -41] },
          properties: { mmi: 5, count: 2 },
        },
      ],
    };
    const result = parseGeoNetFeltRapid(payload);
    expect(result.count).toBe(2);
    expect(result.byMmi).toEqual({ '5': 2 });
  });

  it('rejects a payload without the feature collection type', () => {
    expect(() => parseGeoNetFeltRapid({ features: [] })).toThrow(NzSourceParseError);
  });
});

describe('fetchGeoNetFeltRapid', () => {
  it('fetches and parses the latest reports', async () => {
    const result = await fetchGeoNetFeltRapid(stubFetch);
    expect(result.points).toHaveLength(4);
  });

  it('requests the reported intensity endpoint', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchGeoNetFeltRapid(fetchImpl);
    expect(requestedUrl).toBe('https://api.geonet.org.nz/intensity?type=reported');
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchGeoNetFeltRapid(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('geonetFeltRapidAdapter', () => {
  it('registers the kebab-case id and keyless auth', () => {
    expect(geonetFeltRapidAdapter.id).toBe(GEONET_FELT_RAPID_SOURCE_ID);
    expect(geonetFeltRapidAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(geonetFeltRapidAdapter.loadFixture().count).toBe(4);
  });

  it('fetches through fetchLive with a stubbed fetch', async () => {
    await expect(geonetFeltRapidAdapter.fetchLive({ fetchImpl: stubFetch })).resolves.toMatchObject(
      { count: 4 }
    );
  });
});
