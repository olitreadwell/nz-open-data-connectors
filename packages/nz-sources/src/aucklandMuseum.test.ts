import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  AUCKLAND_MUSEUM_SOURCE_ID,
  aucklandMuseumAdapter,
  parseAucklandMuseumRecords,
  searchAucklandMuseumRecords,
} from './aucklandMuseum.js';

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'src/fixtures/auckland-museum-ice-axe-2026-11-16.json'),
    'utf8'
  )
) as unknown;

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseAucklandMuseumRecords', () => {
  it('parses the Elasticsearch hit envelope', () => {
    const result = parseAucklandMuseumRecords(FIXTURE);
    expect(result.total).toBe(10000);
    expect(result.records).toHaveLength(20);
    expect(result.records[0]).toMatchObject({
      id: 'http://api.aucklandmuseum.com/id/humanhistory/object/671988',
      title: 'axe, ice',
      type: 'ecrm:E22_Man-Made_Object',
      copyright: '© Auckland Museum CC BY',
    });
  });

  it('keeps the linked primary representation', () => {
    const result = parseAucklandMuseumRecords(FIXTURE);
    expect(result.records[0]?.primaryRepresentation).toBe(
      'http://api.aucklandmuseum.com/id/media/v/232518'
    );
  });

  it('accepts a numeric total from an older Elasticsearch response', () => {
    const numericTotal = {
      hits: {
        total: 1,
        hits: [
          {
            _id: 'record-1',
            _source: {
              dc_title: ['Example'],
              dc_description: ['A description'],
              type: 'ecrm:E22_Man-Made_Object',
              department: ['History'],
              dc_identifier: ['123'],
              copyright: [],
              lastModifiedOn: [],
            },
          },
        ],
      },
    };
    const result = parseAucklandMuseumRecords(numericTotal);
    expect(result.total).toBe(1);
    expect(result.records[0]?.title).toBe('Example');
    expect(result.records[0]?.description).toBe('A description');
  });

  it('rejects a payload without the hits envelope', () => {
    expect(() => parseAucklandMuseumRecords({ records: [] })).toThrow(NzSourceParseError);
  });
});

describe('searchAucklandMuseumRecords', () => {
  it('fetches and parses a collection search', async () => {
    const result = await searchAucklandMuseumRecords('ice axe', 20, stubFetch);
    expect(result.records).toHaveLength(20);
  });

  it('passes the query and size to the collections index', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await searchAucklandMuseumRecords('ice axe', 5, fetchImpl);
    const url = new URL(requestedUrl);
    expect(url.pathname).toBe('/search/collectionsonline/_search');
    expect(url.searchParams.get('q')).toBe('ice axe');
    expect(url.searchParams.get('size')).toBe('5');
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(searchAucklandMuseumRecords('ice axe', 20, fetchImpl)).rejects.toThrow(
      NzSourceApiError
    );
  });
});

describe('aucklandMuseumAdapter', () => {
  it('registers the kebab-case id and keyless auth', () => {
    expect(aucklandMuseumAdapter.id).toBe(AUCKLAND_MUSEUM_SOURCE_ID);
    expect(aucklandMuseumAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(aucklandMuseumAdapter.loadFixture().records).toHaveLength(20);
  });

  it('fetches through fetchLive with a stubbed fetch', async () => {
    await expect(aucklandMuseumAdapter.fetchLive({ fetchImpl: stubFetch })).resolves.toMatchObject({
      total: 10000,
    });
  });
});
