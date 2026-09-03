import { afterEach, describe, expect, it, vi } from 'vitest';

import { readFixtureJson, readFixtureText } from './fixtures.js';
import { getNzDataSource, probeAllNzDataSources, probeNzDataSource } from './registry.js';
import { NZ_DATA_SOURCES } from './registry.js';
import type { NzDataAdapter } from './types.js';

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200 });
}

function firstSource(): NzDataAdapter<unknown> {
  const source = NZ_DATA_SOURCES[0];
  if (source === undefined) {
    throw new Error('expected at least one registered source');
  }
  return source;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('registry', () => {
  it('looks up a source adapter by id', () => {
    expect(getNzDataSource('geonet')?.name).toContain('GeoNet');
    expect(getNzDataSource('does-not-exist')).toBeUndefined();
  });

  it('probes a source with a live fetch and reports ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(readFixtureJson('geonet-quakes-mmi3.json')))
    );
    const probe = await probeNzDataSource(firstSource());
    expect(probe.ok).toBe(true);
    expect(probe.status).toBe('ok');
    expect(probe.sample).toContain('publicId');
  });

  it('reports a failed probe with the error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 }))
    );
    const probe = await probeNzDataSource(firstSource());
    expect(probe.ok).toBe(false);
    expect(probe.status).toContain('HTTP 500');
  });

  it('probes every registered source and reports one result each', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const hostname = new URL(url).hostname;
        if (hostname === 'api.geonet.org.nz') {
          return jsonResponse(readFixtureJson('geonet-quakes-mmi3.json'));
        }
        if (url.includes('sfs/api/search')) {
          return jsonResponse(readFixtureJson('ade-search-earnings.json'));
        }
        if (url.includes('datastore_search')) {
          return jsonResponse(readFixtureJson('data-govt-datastore-msd-benefits.json'));
        }
        if (hostname === 'catalogue.data.govt.nz') {
          return jsonResponse(readFixtureJson('data-govt-nz-search-sheep.json'));
        }
        if (hostname === 'api.digitalnz.org') {
          return jsonResponse(readFixtureJson('digitalnz-search-sheep.json'));
        }
        if (hostname === 'api.trademe.co.nz') {
          return jsonResponse(readFixtureJson('trademe-categories.json'));
        }
        if (hostname === 'data.nzor.org.nz') {
          return new Response(readFixtureText('nzor-names-kiwi.xml'), {
            status: 200,
          });
        }
        if (hostname === 'data.linz.govt.nz') {
          return jsonResponse(readFixtureJson('linz-layer-search.json'));
        }
        if (hostname === 'data-aucklandcouncil.opendata.arcgis.com') {
          return jsonResponse(
            readFixtureJson(
              'arcgis-hub-data-aucklandcouncil.opendata.arcgis.com-collections-2026-08-25.json'
            )
          );
        }
        if (hostname === 'www.lawa.org.nz') {
          return jsonResponse(readFixtureJson('lawa-river-quality-sites-2026-08-25.json'));
        }
        if (hostname === 'data.mfe.govt.nz') {
          return jsonResponse(readFixtureJson('mfe-layer-search-water-2026-08-25.json'));
        }
        if (hostname === 'lris.scinfo.org.nz') {
          return jsonResponse(readFixtureJson('lris-layer-search-soil-2026-08-25.json'));
        }
        if (hostname === 'www.journeys.nzta.govt.nz') {
          return jsonResponse(readFixtureJson('nzta-holiday-hotspots-2026-08-25.json'));
        }
        return new Response('unexpected url', { status: 404 });
      })
    );
    const probes = await probeAllNzDataSources();
    expect(probes).toHaveLength(NZ_DATA_SOURCES.length);
    const keyless = probes.filter((probe) => probe.auth === 'none');
    expect(keyless.every((probe) => probe.ok)).toBe(true);
  });
});
