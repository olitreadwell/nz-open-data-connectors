import { NzSourceParseError } from './errors.js';
import { readFixtureText } from './fixtures.js';
import { httpGet, httpPost } from './http.js';
import type { NzDataAdapter } from './types.js';

/** The Infoshare search form, which starts a session before it accepts a query. */
const SEARCH_PAGE_URL = 'https://infoshare.stats.govt.nz/SearchPage.aspx';

/** The results page the search form redirects to. */
const RESULTS_PAGE_URL = 'https://infoshare.stats.govt.nz/SearchResults.aspx';

/** One table in the Infoshare catalogue. */
export interface InfoshareTable {
  /** Table title as published, e.g. "Filled Jobs by Industry". */
  title: string;
  /** Folder path inside Infoshare, without the trailing separator. */
  tablePath: string;
  /** Last update line shown in the search result, e.g. "04 November 2026 10:45am". */
  lastUpdated: string;
}

/** A page of Infoshare table search results. */
export interface InfoshareSearchResult {
  /** The query Infoshare ran, echoed in a hidden form field. */
  query: string;
  /** Total matching tables across every results page. */
  totalResults: number;
  /** Up to 20 tables on the first results page. */
  tables: InfoshareTable[];
}

/** The search result anchor emitted once per table. */
const RESULT_PATTERN =
  /<a id="ctl00_MainContent_rptSearchResults_ctl\d+_lbSelectTable"[^>]*>([\s\S]*?)<\/a>\s*<br\s*\/?>\s*<i>Last updated:\s*([\s\S]*?)<\/i>\s*<br\s*\/?>\s*<i>Table path:\s*([\s\S]*?)<\/i>/g;

/** The count line above the result list. */
const TOTAL_PATTERN = /Your search returned (\d+) results?/;

/** The hidden query field echoed on the results page. */
const QUERY_PATTERN = /id="ctl00_MainContent_hfSearchText"[^>]*value="([^"]*)"/;

/**
 * Decodes the small set of HTML entities Infoshare puts in table titles.
 *
 * The page uses named entities and leaves some ampersands bare (for example
 * "All Ind.&Both Sexes"), so this only decodes well-formed entities.
 *
 * @param value - Text taken from the results HTML.
 * @returns The text with entities decoded and tags removed.
 */
function cleanHtmlText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses an Infoshare search results page into table records.
 *
 * @param payload - Raw HTML from `SearchResults.aspx`.
 * @returns The echoed query, total match count, and first-page tables.
 * @throws {NzSourceParseError} When the payload is not an Infoshare results page.
 */
export function parseInfoshareSearchResults(payload: unknown): InfoshareSearchResult {
  if (typeof payload !== 'string') {
    throw new NzSourceParseError('Infoshare', 'expected an HTML string');
  }
  const totalMatch = TOTAL_PATTERN.exec(payload);
  const queryMatch = QUERY_PATTERN.exec(payload);
  if (totalMatch === null || queryMatch === null) {
    throw new NzSourceParseError('Infoshare', 'payload is not a search results page');
  }
  const totalResults = Number(totalMatch[1]);
  if (!Number.isFinite(totalResults)) {
    throw new NzSourceParseError('Infoshare', `invalid result count: ${String(totalMatch[1])}`);
  }
  const tables: InfoshareTable[] = [];
  for (const match of payload.matchAll(RESULT_PATTERN)) {
    const title = cleanHtmlText(match[1] ?? '');
    const lastUpdated = cleanHtmlText(match[2] ?? '');
    const tablePath = cleanHtmlText(match[3] ?? '').replace(/\\+$/, '');
    if (title.length > 0) {
      tables.push({ title, tablePath, lastUpdated });
    }
  }
  if (totalResults > 0 && tables.length === 0) {
    throw new NzSourceParseError('Infoshare', 'result count was positive but no tables were found');
  }
  return { query: cleanHtmlText(queryMatch[1] ?? ''), totalResults, tables };
}

/**
 * Reads a hidden ASP.NET form field from the search page.
 *
 * @param html - Search page HTML.
 * @param name - Field name, e.g. `__VIEWSTATE`.
 * @returns The field value, or `undefined` when the page omits it.
 */
function readHiddenField(html: string, name: string): string | undefined {
  const pattern = new RegExp(`name="${name}"[^>]*value="([^"]*)"`);
  const match = html.match(pattern);
  return match?.[1];
}

/**
 * Builds the form body the Infoshare search button posts.
 *
 * @param html - Search page HTML carrying the view state.
 * @param query - Keyword to search for.
 * @returns URL-encoded form fields for the POST.
 * @throws {NzSourceParseError} When the view state is missing.
 */
function buildSearchForm(html: string, query: string): URLSearchParams {
  const viewState = readHiddenField(html, '__VIEWSTATE');
  const eventValidation = readHiddenField(html, '__EVENTVALIDATION');
  if (viewState === undefined || eventValidation === undefined) {
    throw new NzSourceParseError('Infoshare', 'search page is missing its view state');
  }
  const form = new URLSearchParams({
    __EVENTTARGET: '',
    __EVENTARGUMENT: '',
    __VIEWSTATE: viewState,
    __EVENTVALIDATION: eventValidation,
    ctl00$MainContent$ctlSearch$tbSearchText: query,
    ctl00$MainContent$ctlSearch$rblSearchOptions: 'rbSearchOptionsOr',
    'ctl00$MainContent$ctlSearch$btnSearch.x': '10',
    'ctl00$MainContent$ctlSearch$btnSearch.y': '10',
  });
  const viewStateGenerator = readHiddenField(html, '__VIEWSTATEGENERATOR');
  if (viewStateGenerator !== undefined) {
    form.set('__VIEWSTATEGENERATOR', viewStateGenerator);
  }
  return form;
}

/**
 * Adds response cookies to a session jar, replacing cookies with the same name.
 *
 * @param jar - Cookie values keyed by cookie name.
 * @param response - Response that may set cookies.
 */
function absorbCookies(jar: Map<string, string>, response: Response): void {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';', 1)[0] ?? '';
    const separator = pair.indexOf('=');
    if (separator > 0) {
      jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
    }
  }
}

/** Builds a Cookie header from the session jar, or undefined when empty. */
function cookieHeader(jar: Map<string, string>): string | undefined {
  if (jar.size === 0) {
    return undefined;
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}

/** Request headers for a session-bound Infoshare call. */
function sessionHeaders(
  jar: Map<string, string>,
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers = { ...extra };
  const cookie = cookieHeader(jar);
  if (cookie !== undefined) {
    headers.cookie = cookie;
  }
  return headers;
}

/**
 * Searches the Infoshare table catalogue by keyword.
 *
 * Infoshare is an ASP.NET application: the adapter opens the search page to
 * get the view state and session cookie, posts the query, then reads the
 * results page. Keyless; throws on an unreachable or rejected search.
 *
 * @param query - Search text, e.g. "employment".
 * @param options - Fetch implementation override for tests.
 * @returns The first page of table results.
 * @throws {NzSourceApiError} When Infoshare is unreachable or rejects the request.
 * @throws {NzSourceParseError} When a page does not look like the expected form.
 */
export async function searchInfoshareTables(
  query: string,
  options: { fetchImpl?: typeof globalThis.fetch } = {}
): Promise<InfoshareSearchResult> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const jar = new Map<string, string>();
  const searchPage = await httpGet('Infoshare', SEARCH_PAGE_URL, { fetchImpl });
  absorbCookies(jar, searchPage);
  const form = buildSearchForm(await searchPage.text(), query);
  const post = await httpPost('Infoshare', SEARCH_PAGE_URL, form, {
    fetchImpl,
    headers: sessionHeaders(jar, {
      'content-type': 'application/x-www-form-urlencoded',
    }),
    redirect: 'manual',
  });
  absorbCookies(jar, post);
  if (post.ok) {
    return parseInfoshareSearchResults(await post.text());
  }
  const results = await httpGet('Infoshare', RESULTS_PAGE_URL, {
    fetchImpl,
    headers: sessionHeaders(jar),
  });
  return parseInfoshareSearchResults(await results.text());
}

/**
 * Stats NZ Infoshare adapter: searches the table catalogue. Keyless.
 * The live probe searches for "employment".
 */
export const infoshareAdapter: NzDataAdapter<InfoshareSearchResult> = {
  id: 'infoshare',
  name: 'Stats NZ Infoshare table catalogue',
  auth: 'none',
  description: 'Searches Infoshare tables by keyword, with folder and last-updated details.',
  fetchLive: (options) =>
    searchInfoshareTables(
      'employment',
      options?.fetchImpl === undefined ? {} : { fetchImpl: options.fetchImpl }
    ),
  parse: parseInfoshareSearchResults,
  loadFixture: () =>
    parseInfoshareSearchResults(readFixtureText('infoshare-search-employment-2026-11-06.html')),
};
