import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors';
import { infoshareAdapter, parseInfoshareSearchResults, searchInfoshareTables } from './infoshare';

const FIXTURE = readFileSync(
  path.join(process.cwd(), 'src/fixtures/infoshare-search-employment-2026-11-06.html'),
  'utf8'
);

const SEARCH_PAGE = `<!DOCTYPE html><html><body><form id="aspnetForm">
<input type="hidden" name="__VIEWSTATE" value="view-state" />
<input type="hidden" name="__VIEWSTATEGENERATOR" value="generator" />
<input type="hidden" name="__EVENTVALIDATION" value="validation" />
<input name="ctl00$MainContent$ctlSearch$tbSearchText" />
</form></body></html>`;

/** Builds a response that sets a cookie, as the Infoshare session does. */
function htmlResponse(body: string, cookies: string[] = []): Response {
  const headers = new Headers({ 'content-type': 'text/html' });
  for (const cookie of cookies) {
    headers.append('set-cookie', cookie);
  }
  return new Response(body, { status: 200, headers });
}

describe('parseInfoshareSearchResults', () => {
  it('parses the committed Infoshare search fixture', () => {
    const result = parseInfoshareSearchResults(FIXTURE);
    expect(result.query).toBe('employment');
    expect(result.totalResults).toBe(180);
    expect(result.tables).toHaveLength(20);
    expect(result.tables[0]?.title).toContain('Filled Jobs');
    expect(result.tables[0]?.tablePath).toBe(
      'Work income and spending\\Quarterly Employment Survey - QEM'
    );
    expect(result.tables[0]?.lastUpdated).toBe('04 November 2026 10:45am');
  });

  it('rejects a payload that is not HTML text', () => {
    expect(() => parseInfoshareSearchResults({ results: [] })).toThrow(NzSourceParseError);
  });

  it('rejects HTML that is not an Infoshare results page', () => {
    expect(() => parseInfoshareSearchResults('<html><body>Not found</body></html>')).toThrow(
      NzSourceParseError
    );
  });
});

describe('searchInfoshareTables', () => {
  it('runs the search form and parses the results page', async () => {
    const calls: RequestInit[] = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      calls.push(init ?? {});
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (init?.method === 'POST') {
        return new Response('', {
          status: 302,
          headers: {
            location: '/SearchResults.aspx',
            'set-cookie': 'ASP.NET_SessionId=after; path=/',
          },
        });
      }
      if (url.endsWith('/SearchResults.aspx')) {
        return htmlResponse(FIXTURE);
      }
      return htmlResponse(SEARCH_PAGE, ['ASP.NET_SessionId=before; path=/']);
    }) as typeof fetch;

    const result = await searchInfoshareTables('employment', { fetchImpl });

    expect(result.totalResults).toBe(180);
    expect(result.tables).toHaveLength(20);
    expect(calls).toHaveLength(3);
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.redirect).toBe('manual');
    expect(post?.body).toBeInstanceOf(URLSearchParams);
    expect((post?.body as URLSearchParams).get('ctl00$MainContent$ctlSearch$tbSearchText')).toBe(
      'employment'
    );
  });

  it('sends the session cookie back to the results page', async () => {
    const cookieHeaders: string[] = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      cookieHeaders.push(headers.cookie ?? '');
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (init?.method === 'POST') {
        return new Response('', {
          status: 302,
          headers: { location: '/SearchResults.aspx' },
        });
      }
      if (url.endsWith('/SearchResults.aspx')) {
        return htmlResponse(FIXTURE);
      }
      return htmlResponse(SEARCH_PAGE, ['ASP.NET_SessionId=session-1; path=/']);
    }) as typeof fetch;

    await searchInfoshareTables('employment', { fetchImpl });

    expect(cookieHeaders[0]).toBe('');
    expect(cookieHeaders[1]).toContain('ASP.NET_SessionId=session-1');
    expect(cookieHeaders[2]).toContain('ASP.NET_SessionId=session-1');
  });

  it('throws an API error when the search page is unreachable', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as typeof fetch;
    await expect(searchInfoshareTables('employment', { fetchImpl })).rejects.toThrow(
      NzSourceApiError
    );
  });
});

describe('infoshareAdapter', () => {
  it('loads the committed fixture', () => {
    const result = infoshareAdapter.loadFixture();
    expect(result.query).toBe('employment');
    expect(result.tables).toHaveLength(20);
  });

  it('is keyless', () => {
    expect(infoshareAdapter.auth).toBe('none');
  });
});
