import { parseDataflowCatalogueXml } from './catalogue.js';
import { parseCodelistXml } from './codelist.js';
import { parseStatsNzCsv } from './csv.js';
import { StatsNzApiError, StatsNzError } from './errors.js';
import { parseSdmxJsonResponse } from './sdmxJson.js';
import type {
  StatsNzClient,
  StatsNzClientOptions,
  StatsNzCodelist,
  StatsNzDataflow,
  StatsNzDataFormat,
  StatsNzGetDataRequest,
  StatsNzObservation,
} from './types.js';

const DEFAULT_BASE_URL = 'https://api.data.stats.govt.nz/rest';
// Every dataflow in the current ADE catalogue is published at version 1.0
// (verified against the live catalogue), and the keyless access path requires
// an explicit version. Callers with a subscription key can pass `latest`.
const DEFAULT_VERSION = '1.0';
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 20;
const USER_AGENT = 'nz-open-data-connectors (Language=TypeScript)';
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'host',
]);
const SENSITIVE_HEADER_PARTS = [
  'api-key',
  'apikey',
  'subscription-key',
  'access-token',
  'auth-token',
  'access-key',
  'auth',
  'secret',
  'token',
];

/** Tests whether a header must be dropped when a redirect changes origin. */
function isSensitiveHeader(name: string): boolean {
  const lowered = name.toLowerCase();
  return (
    SENSITIVE_HEADER_NAMES.has(lowered) ||
    SENSITIVE_HEADER_PARTS.some((part) => lowered.includes(part))
  );
}

/** Drops credentials before a redirect leaves the current origin. */
function stripSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).filter(([name]) => !isSensitiveHeader(name)));
}
const VALID_FORMATS: StatsNzDataFormat[] = ['csv', 'csvfilewithlabels', 'jsondata'];

/**
 * Normalizes the optional subscription key.
 *
 * A key that is set but empty (`STATS_NZ_SUBSCRIPTION_KEY=`) is treated as
 * absent, so a blank header never reaches the API. The same helper lives in
 * `@nz-open-data-connectors/nz-sources` as `normalizeSourceApiKey`; the two
 * packages are published separately and do not depend on each other.
 *
 * @param key - The raw key, or undefined when unset.
 * @returns The trimmed key, or undefined when it is blank.
 */
export function normalizeStatsNzSubscriptionKey(key: string | undefined): string | undefined {
  const trimmed = key?.trim();
  if (trimmed === undefined || trimmed === '') {
    return undefined;
  }
  return trimmed;
}

/**
 * Creates a Stats NZ (ADE) API client.
 * @param options - optional base URL, subscription key, fetch impl, and timeout
 * @returns A client with catalogue, data, and codelist methods
 */
export function createStatsNzClient(options: StatsNzClientOptions = {}): StatsNzClient {
  let baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  while (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  const subscriptionKey = normalizeStatsNzSubscriptionKey(options.subscriptionKey);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function sendRequest(path: string, accept: string): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: accept,
      'Cache-Control': 'no-cache',
      'user-agent': USER_AGENT,
    };
    if (subscriptionKey !== undefined) {
      headers['Ocp-Apim-Subscription-Key'] = subscriptionKey;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${baseUrl}${path}`;
    let currentUrl = url;
    let currentHeaders = headers;

    try {
      for (let redirects = 0; ; redirects += 1) {
        const response = await fetchImpl(currentUrl, {
          headers: currentHeaders,
          signal: controller.signal,
          cache: 'no-store',
          redirect: 'manual',
        });
        if (!REDIRECT_STATUSES.has(response.status)) {
          return response;
        }

        const location = response.headers.get('location');
        if (location === null) {
          return response;
        }
        if (redirects >= MAX_REDIRECTS) {
          throw new StatsNzApiError(
            `Stats NZ request redirected more than ${MAX_REDIRECTS} times`,
            { status: 0, retryable: false, url }
          );
        }

        const nextUrl = new URL(location, currentUrl).toString();
        if (new URL(currentUrl).origin !== new URL(nextUrl).origin) {
          currentHeaders = stripSensitiveHeaders(currentHeaders);
        }
        currentUrl = nextUrl;
      }
    } catch (error) {
      if (error instanceof StatsNzApiError) {
        throw error;
      }
      if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
        throw new StatsNzApiError(`Stats NZ request timed out after ${timeoutMs}ms`, {
          status: 0,
          retryable: true,
          url,
        });
      }
      throw new StatsNzApiError(`Stats NZ request failed: ${String(error)}`, {
        status: 0,
        retryable: true,
        url,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function toApiError(response: Response, url: string): Promise<StatsNzApiError> {
    let message = `Stats NZ API request failed with status ${response.status}`;
    let body: { message?: unknown } | undefined;
    try {
      body = (await response.json()) as { message?: unknown };
    } catch {
      body = undefined;
    }
    if (typeof body?.message === 'string' && body.message.length > 0) {
      message = body.message;
    }
    return new StatsNzApiError(message, {
      status: response.status,
      retryable: response.status === 429 || response.status >= 500,
      url,
    });
  }

  async function getData(request: StatsNzGetDataRequest): Promise<StatsNzObservation[]> {
    const format = request.format ?? 'csv';
    if (!VALID_FORMATS.includes(format)) {
      throw new StatsNzError(`Unsupported Stats NZ response format: ${format}`);
    }
    const version = request.version ?? DEFAULT_VERSION;
    const versionSegment = `,${encodeURIComponent(version)}`;
    const path = `/data/STATSNZ,${encodeURIComponent(request.dataflowId)}${versionSegment}/${encodeURIComponent(request.key ?? 'all')}?format=${format}`;
    const accept = format === 'jsondata' ? 'application/json' : 'text/csv';

    const response = await sendRequest(path, accept);
    if (!response.ok) {
      throw await toApiError(response, `${baseUrl}${path}`);
    }

    const text = await response.text();
    if (format === 'jsondata') {
      return parseSdmxJsonResponse(text);
    }
    return parseStatsNzCsv(text, { dataflowId: request.dataflowId });
  }

  async function getDataflowCatalogue(): Promise<StatsNzDataflow[]> {
    const path = '/dataflow/STATSNZ/all';
    const response = await sendRequest(path, 'application/xml');
    if (!response.ok) {
      throw await toApiError(response, `${baseUrl}${path}`);
    }
    return parseDataflowCatalogueXml(await response.text());
  }

  async function getCodelist(
    codelistId: string,
    options: { version?: string } = {}
  ): Promise<StatsNzCodelist> {
    const versionSegment =
      options.version === undefined ? '' : `/${encodeURIComponent(options.version)}`;
    const path = `/codelist/STATSNZ/${encodeURIComponent(codelistId)}${versionSegment}`;
    const response = await sendRequest(path, 'application/xml');
    if (!response.ok) {
      throw await toApiError(response, `${baseUrl}${path}`);
    }
    return parseCodelistXml(await response.text());
  }

  return {
    getDataflowCatalogue,
    getData,
    getCodelist,
  };
}
