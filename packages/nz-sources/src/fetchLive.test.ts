import { afterEach, describe, expect, it, vi } from 'vitest';

import { adeSearchAdapter } from './adeSearch.js';
import { dataGovtDatastoreAdapter } from './dataGovtDatastore.js';
import { dataGovtNzAdapter } from './dataGovtNz.js';
import { digitalNzAdapter } from './digitalNz.js';
import { readFixtureJson, readFixtureText } from './fixtures.js';
import { geonetAdapter } from './geonet.js';
import { linzAdapter } from './linz.js';
import { nzorAdapter } from './nzor.js';
import { tradeMeAdapter } from './tradeMe.js';

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200 });
}

function textResponse(payload: string): Response {
  return new Response(payload, { status: 200 });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('adapter fetchLive paths', () => {
  it('fetches and parses GeoNet quakes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixtureJson('geonet-quakes-mmi3.json')))
    );
    const quakes = await geonetAdapter.fetchLive();
    expect(quakes.length).toBeGreaterThan(0);
    expect(quakes[0]?.locality.length).toBeGreaterThan(0);
  });

  it('fetches and parses data.govt.nz datasets', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixtureJson('data-govt-nz-search-sheep.json')))
    );
    const result = await dataGovtNzAdapter.fetchLive();
    expect(result.count).toBeGreaterThan(0);
    expect(result.datasets.length).toBeGreaterThan(0);
    expect(result.datasets[0]?.title.length).toBeGreaterThan(0);
  });

  it('fetches and parses DigitalNZ records', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixtureJson('digitalnz-search-sheep.json')))
    );
    const records = await digitalNzAdapter.fetchLive();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]?.title.length).toBeGreaterThan(0);
  });

  it('fetches and parses Trade Me categories', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixtureJson('trademe-categories.json')))
    );
    const categories = await tradeMeAdapter.fetchLive();
    expect(categories.name.length).toBeGreaterThan(0);
  });

  it('fetches and parses NZOR names', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse(readFixtureText('nzor-names-kiwi.xml')))
    );
    const result = await nzorAdapter.fetchLive();
    expect(result.total).toBeGreaterThan(0);
    expect(result.names.length).toBeGreaterThan(0);
  });

  it('fetches and parses LINZ layer search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixtureJson('linz-layer-search.json')))
    );
    const layers = await linzAdapter.fetchLive();
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0]?.title.length).toBeGreaterThan(0);
  });

  it('fetches and parses data.govt.nz datastore rows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixtureJson('data-govt-datastore-msd-benefits.json')))
    );
    const result = await dataGovtDatastoreAdapter.fetchLive();
    expect(result.records.length).toBeGreaterThan(0);
    expect(String(result.records[0]?.Benefit_Group)).toBe('Jobseeker Support');
  });

  it('fetches and parses ADE search results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixtureJson('ade-search-earnings.json')))
    );
    const result = await adeSearchAdapter.fetchLive();
    expect(result.dataflows.length).toBeGreaterThan(0);
    expect(result.dataflows[0]?.dataflowId).toBe('LEED_AP1_002');
  });
});
