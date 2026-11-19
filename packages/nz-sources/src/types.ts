/** What a source needs before it will answer a request. */
export type NzSourceAuth = 'none' | 'key' | 'account';

/** Options shared by every adapter's live fetch. */
export interface NzFetchOptions {
  apiKey?: string;
  fetchImpl?: typeof globalThis.fetch;
}

/** Licence and attribution metadata for a source-wide licence. */
export interface NzSourceLicense {
  readonly title: string;
  readonly url: string;
  readonly attribution: string;
}

/**
 * Validates and freezes source-wide licence metadata.
 *
 * @param license - The title, URL and attribution to expose with the adapter.
 * @returns A frozen licence object with trimmed fields.
 * @throws When a field is blank or the URL is not an absolute HTTP(S) URL.
 */
export function createSourceLicense(license: NzSourceLicense): NzSourceLicense {
  for (const field of ['title', 'url', 'attribution'] as const) {
    if (typeof license[field] !== 'string' || license[field].trim().length === 0) {
      throw new Error(`Source license ${field} must be a non-empty string`);
    }
  }

  const title = license.title.trim();
  const url = license.url.trim();
  const attribution = license.attribution.trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Source license url must be an absolute HTTP(S) URL');
  }
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Source license url must be an absolute HTTP(S) URL');
  }

  return Object.freeze({
    title,
    url,
    attribution,
  });
}

/**
 * One NZ data source behind a uniform interface: live fetch, strict parse,
 * and a committed fixture for tests. A live fetch never falls back to it.
 */
export interface NzDataAdapter<T> {
  readonly id: string;
  readonly name: string;
  readonly auth: NzSourceAuth;
  readonly description: string;
  readonly license?: NzSourceLicense;
  fetchLive(options?: NzFetchOptions): Promise<T>;
  parse(payload: unknown): T;
  loadFixture(): T;
}

/** Result of a live verification probe against one source. */
export interface NzSourceProbe {
  id: string;
  name: string;
  auth: NzSourceAuth;
  ok: boolean;
  status: string;
  sample?: string;
}
