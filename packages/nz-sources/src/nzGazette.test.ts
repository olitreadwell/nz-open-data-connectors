import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import { NZ_GAZETTE_SOURCE_ID, fetchNzGazetteNotices, nzGazetteAdapter } from './nzGazette.js';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/nz-gazette-2026-11-16.json'), 'utf8')
) as unknown;

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('fetchNzGazetteNotices', () => {
  it('parses the latest Gazette notices', async () => {
    const notices = await fetchNzGazetteNotices({ fetchImpl: stubFetch });
    expect(notices).toHaveLength(20);
    expect(notices[0]?.title).toContain('SEASONS SHIPPING LIMITED');
    expect(notices[0]?.displayDate).toBe('13 Nov 2026');
  });

  it('filters DigitalNZ to the Gazette collection and sorts newest first', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchNzGazetteNotices({ fetchImpl });
    const url = new URL(requestedUrl);
    expect(url.searchParams.get('and[primary_collection][]')).toBe('New Zealand Gazette');
    expect(url.searchParams.get('sort')).toBe('date');
  });

  it('passes an optional DigitalNZ key through', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await fetchNzGazetteNotices({ fetchImpl, apiKey: 'secret' });
    expect(new URL(requestedUrl).searchParams.get('api_key')).toBe('secret');
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchNzGazetteNotices({ fetchImpl })).rejects.toThrow(NzSourceApiError);
  });

  it('rejects a non-DigitalNZ payload', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ records: [] }), { status: 200 })) as typeof fetch;
    await expect(fetchNzGazetteNotices({ fetchImpl })).rejects.toThrow(NzSourceParseError);
  });
});

describe('nzGazetteAdapter', () => {
  it('registers the kebab-case id and keyless auth', () => {
    expect(nzGazetteAdapter.id).toBe(NZ_GAZETTE_SOURCE_ID);
    expect(nzGazetteAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(nzGazetteAdapter.loadFixture()).toHaveLength(20);
  });

  it('fetches through fetchLive with a stubbed fetch', async () => {
    await expect(nzGazetteAdapter.fetchLive({ fetchImpl: stubFetch })).resolves.toHaveLength(20);
  });
});
