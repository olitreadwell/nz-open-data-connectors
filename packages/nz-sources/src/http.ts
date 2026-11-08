import { NzSourceApiError } from './errors.js';

/**
 * Identifies this client to the public APIs it calls.
 *
 * Several NZ government endpoints sit behind gateways that rate-limit or
 * block clients they cannot identify, so every adapter sends this. The string
 * carries no version, so it cannot go stale between releases.
 */
export const USER_AGENT = 'nz-open-data-connectors (Language=TypeScript)';

/** Per-request timeout in milliseconds, applied to every adapter. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Redirects followed before a request is treated as a redirect loop. */
export const MAX_REDIRECTS = 20;

/** Status codes a redirect chain may use. */
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** The one status code worth retrying: the server is asking us to slow down. */
const HTTP_TOO_MANY_REQUESTS = 429;

/** Headers that must not cross an origin boundary on a redirect. */
const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'host',
]);

/** Header-name fragments that usually carry a credential. */
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

/**
 * Tests whether a request header is sensitive enough to drop on a cross-origin
 * redirect.
 *
 * @param name - header name
 * @returns true when a redirect to another origin must not carry the header
 */
function isSensitiveHeader(name: string): boolean {
  const lowered = name.toLowerCase();
  return (
    SENSITIVE_HEADER_NAMES.has(lowered) ||
    SENSITIVE_HEADER_PARTS.some((part) => lowered.includes(part))
  );
}

/**
 * Drops credentials before a redirect leaves the current origin.
 *
 * @param headers - headers for the current request
 * @returns a copy without sensitive headers
 */
function stripSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).filter(([name]) => !isSensitiveHeader(name)));
}

/**
 * Compares two absolute URLs by scheme, host, and port.
 *
 * @param left - first URL
 * @param right - second URL
 * @returns true when both URLs share an origin
 */
function sameOrigin(left: string, right: string): boolean {
  return new URL(left).origin === new URL(right).origin;
}

/** The lowest status code that means the server failed rather than the request. */
const HTTP_INTERNAL_SERVER_ERROR = 500;

/** Options shared by the shared HTTP helpers. */
export interface HttpGetOptions {
  /** Fetch implementation override, used by tests. */
  fetchImpl?: typeof globalThis.fetch | undefined;
  /** Extra request headers, merged over the defaults. */
  headers?: Record<string, string> | undefined;
  /** Overrides {@link DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number | undefined;
}

/** Options shared by the POST helper. */
export interface HttpPostOptions extends HttpGetOptions {
  /** Redirect mode, e.g. `manual` when the caller must read the `location`. */
  redirect?: RequestRedirect | undefined;
}

/**
 * Builds the request headers, letting a caller replace the User-Agent.
 *
 * Most adapters send only the default identity. A few sources (the SEC and
 * the National Weather Service, for example) ask for a more descriptive
 * User-Agent of their own, and that one wins. Other headers merge over the
 * defaults.
 *
 * @param extra - Headers supplied by the adapter.
 * @returns The headers for one request.
 */
function buildRequestHeaders(extra: Record<string, string> | undefined): Record<string, string> {
  const headers: Record<string, string> = { 'user-agent': USER_AGENT };
  for (const [name, value] of Object.entries(extra ?? {})) {
    if (name.toLowerCase() === 'user-agent') {
      headers['user-agent'] = value;
    } else {
      headers[name] = value;
    }
  }
  return headers;
}

/**
 * Issues a GET through the shared HTTP layer.
 *
 * Every adapter goes through here so that three things happen the same way
 * for all 22 sources: a `user-agent` identifies the client, a timeout aborts
 * a request that hangs, and a failure carries whether retrying is worthwhile.
 *
 * @param source - Source name used in the error message, e.g. "GeoNet".
 * @param url - Absolute URL or URL object to fetch.
 * @param options - Fetch override, extra headers, and timeout.
 * @returns The response, already checked for a successful status.
 * @throws {NzSourceApiError} On a non-2xx status, an abort, or a network error.
 */
export async function httpGet(
  source: string,
  url: string | URL,
  options: HttpGetOptions = {}
): Promise<Response> {
  return request(source, url, {}, options, false, true);
}

/**
 * Issues a POST through the shared HTTP layer.
 *
 * Uses the same identity, timeout, and retryable error mapping as
 * {@link httpGet}. A caller that needs to read a redirect sets
 * `redirect: 'manual'`; the 3xx response is then returned instead of thrown.
 *
 * @param source - Source name used in the error message, e.g. "Infoshare".
 * @param url - Absolute URL or URL object to fetch.
 * @param body - Form body or raw request body.
 * @param options - Fetch override, headers, timeout, and redirect mode.
 * @returns The response, already checked for a successful status.
 * @throws {NzSourceApiError} On an unrecoverable status, an abort, or a network error.
 */
export async function httpPost(
  source: string,
  url: string | URL,
  body: string | URLSearchParams,
  options: HttpPostOptions = {}
): Promise<Response> {
  const init: RequestInit = { method: 'POST', body };
  if (options.redirect !== undefined) {
    init.redirect = options.redirect;
  }
  return request(source, url, init, options, true, false);
}

/** Drops entity headers when a redirect turns a request into a GET. */
function stripBodyHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => {
      const lowered = name.toLowerCase();
      return lowered !== 'content-type' && lowered !== 'content-length';
    })
  );
}

/** Runs one request and maps failures to the shared error type. */
async function request(
  source: string,
  url: string | URL,
  init: RequestInit,
  options: HttpGetOptions,
  acceptRedirect: boolean,
  followRedirects: boolean
): Promise<Response> {
  const doFetch = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let currentUrl = new URL(url).toString();
  let currentInit: RequestInit = {
    ...init,
    headers: buildRequestHeaders(options.headers),
    signal: controller.signal,
  };
  let response: Response;

  try {
    for (let redirects = 0; ; redirects += 1) {
      response = await doFetch(currentUrl, {
        ...currentInit,
        ...(followRedirects ? { redirect: 'manual' } : {}),
      });

      if (!followRedirects || !REDIRECT_STATUSES.has(response.status)) {
        break;
      }

      const location = response.headers.get('location');
      if (location === null) {
        break;
      }
      if (redirects >= MAX_REDIRECTS) {
        throw new NzSourceApiError(source, `too many redirects after ${MAX_REDIRECTS}`, {
          retryable: false,
        });
      }

      const nextUrl = new URL(location, currentUrl).toString();
      let nextHeaders = currentInit.headers as Record<string, string>;
      if (!sameOrigin(currentUrl, nextUrl)) {
        nextHeaders = stripSensitiveHeaders(nextHeaders);
      }

      let nextInit: RequestInit = { ...currentInit, headers: nextHeaders };
      if (
        response.status === 303 ||
        ((response.status === 301 || response.status === 302) &&
          (nextInit.method ?? 'GET') !== 'GET')
      ) {
        nextInit = { ...nextInit, method: 'GET' };
        delete nextInit.body;
        nextInit.headers = stripBodyHeaders(nextHeaders);
      }

      currentUrl = nextUrl;
      currentInit = nextInit;
    }
  } catch (error) {
    if (error instanceof NzSourceApiError) {
      throw error;
    }
    if (controller.signal.aborted) {
      throw new NzSourceApiError(source, `request timed out after ${timeoutMs}ms`, {
        retryable: true,
      });
    }
    throw new NzSourceApiError(source, `request failed: ${String(error)}`, { retryable: true });
  } finally {
    clearTimeout(timer);
  }

  const isRedirect = response.status >= 300 && response.status < 400;
  if (!response.ok && !(acceptRedirect && isRedirect)) {
    throw new NzSourceApiError(source, `HTTP ${response.status}`, {
      status: response.status,
      retryable:
        response.status === HTTP_TOO_MANY_REQUESTS || response.status >= HTTP_INTERNAL_SERVER_ERROR,
    });
  }
  return response;
}
