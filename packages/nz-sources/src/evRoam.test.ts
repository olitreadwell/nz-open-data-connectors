import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  EV_ROAM_SOURCE_ID,
  evRoamAdapter,
  fetchEvRoamChargingStations,
  parseEvRoamChargingStations,
} from './evRoam.js';

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'src/fixtures/ev-roam-charging-stations-2026-11-16.json'),
    'utf8'
  )
) as unknown;

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseEvRoamChargingStations', () => {
  it('parses every feature in the published layer', () => {
    const result = parseEvRoamChargingStations(FIXTURE);
    expect(result.count).toBe(639);
    expect(result.stations).toHaveLength(639);
    expect(result.stations[0]).toMatchObject({
      objectId: 745524,
      name: 'Ormiston Town Centre',
      operator: 'Todd Property Ormiston Town Centre Limited',
      is24Hours: true,
      carParkCount: 14,
      currentType: 'AC',
      hasChargingCost: false,
    });
  });

  it('converts the operational epoch date to ISO', () => {
    const result = parseEvRoamChargingStations(FIXTURE);
    expect(result.stations[0]?.dateFirstOperational).toBe('2021-03-25T00:00:00.000Z');
  });

  it('uses WGS84 coordinates from the feature geometry', () => {
    const result = parseEvRoamChargingStations(FIXTURE);
    expect(result.stations[0]?.latitude).toBeCloseTo(-36.964886, 5);
    expect(result.stations[0]?.longitude).toBeCloseTo(174.912617, 5);
  });

  it('normalises missing attribute strings to empty strings', () => {
    const payload = {
      features: [
        {
          attributes: { OBJECTID: 1, name: 'Bare station' },
          geometry: { x: 174, y: -36 },
        },
      ],
    };
    const result = parseEvRoamChargingStations(payload);
    expect(result.stations[0]?.operator).toBe('');
    expect(result.stations[0]?.connectorsList).toBe('');
  });

  it('rejects a payload without features', () => {
    expect(() => parseEvRoamChargingStations({ error: 'nope' })).toThrow(NzSourceParseError);
  });
});

describe('fetchEvRoamChargingStations', () => {
  it('fetches and parses the full layer', async () => {
    const result = await fetchEvRoamChargingStations(stubFetch);
    expect(result.count).toBe(639);
  });

  it('requests WGS84 geometry from the feature service', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchEvRoamChargingStations(fetchImpl);
    const url = new URL(requestedUrl);
    expect(url.pathname).toContain('/EV_Roam_charging_stations/FeatureServer/0/query');
    expect(url.searchParams.get('outSR')).toBe('4326');
    expect(url.searchParams.get('f')).toBe('json');
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchEvRoamChargingStations(fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('evRoamAdapter', () => {
  it('registers the kebab-case id and keyless auth', () => {
    expect(evRoamAdapter.id).toBe(EV_ROAM_SOURCE_ID);
    expect(evRoamAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(evRoamAdapter.loadFixture().count).toBe(639);
  });

  it('fetches through fetchLive with a stubbed fetch', async () => {
    await expect(evRoamAdapter.fetchLive({ fetchImpl: stubFetch })).resolves.toMatchObject({
      count: 639,
    });
  });
});
