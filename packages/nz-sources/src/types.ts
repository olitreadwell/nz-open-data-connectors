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
 * @returns A frozen licence object.
 * @throws When a field is not a non-empty string.
 */
export function createSourceLicense(license: NzSourceLicense): NzSourceLicense {
  for (const field of ['title', 'url', 'attribution'] as const) {
    if (typeof license[field] !== 'string' || license[field].trim().length === 0) {
      throw new Error(`Source license ${field} must be a non-empty string`);
    }
  }
  return Object.freeze({
    title: license.title,
    url: license.url,
    attribution: license.attribution,
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
