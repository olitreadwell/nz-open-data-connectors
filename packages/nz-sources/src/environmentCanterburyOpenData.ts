import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { readFixtureText } from './fixtures.js';
import { httpGet } from './http.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Environment Canterbury open data adapter. */
export const ENVIRONMENT_CANTERBURY_OPEN_DATA_SOURCE_ID = 'environment-canterbury-open-data';

/** Home page of the Environment Canterbury open data portal. */
export const ECAN_OPEN_DATA_PORTAL_URL = 'https://data.ecan.govt.nz/';

const ECAN_CATALOGUE_URL = 'https://data.ecan.govt.nz/Catalogue/Search';

const ECAN_DATA_URL = 'https://data.ecan.govt.nz/data';

/** One dataset listed in the Environment Canterbury open data catalogue. */
export interface EcanDataset {
  /** Numeric method id used by the portal's catalogue and data URLs. */
  methodId: number;
  title: string;
  description: string;
  keywords: string[];
  formats: string[];
  /** Absolute catalogue page for the dataset. */
  url: string;
}

/** One page of the Environment Canterbury catalogue. */
export interface EcanCataloguePage {
  page: number;
  pageSize: number;
  total: number;
  lastPage: number;
  datasets: EcanDataset[];
}

/** The full Environment Canterbury catalogue, gathered across its pages. */
export interface EcanDatasetCatalogue {
  total: number;
  datasets: EcanDataset[];
}

/** One row from a dataset's JSON export, keyed by the published column name. */
export type EcanDatasetRow = Record<string, string | number | null>;

const ECAN_ROW_SCHEMA = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));

const ECAN_ROWS_RESPONSE_SCHEMA = z.object({
  data: z.object({
    item: z.array(ECAN_ROW_SCHEMA),
  }),
});

const TOTAL_PATTERN = /Showing\s+(\d+)\s*-\s*(\d+)\s+of\s+(\d+)/;

const ROLLUP_PATTERN =
  /<div class="rollup"><div class="rollup-inner(?:-alt)?">([\s\S]*?)<\/div><\/div>/g;

const METHOD_LINK_PATTERN = /href="\/Catalogue\/Method\?MethodId=(\d+)">([^<]+)<\/a>/;

const FORMAT_PATTERN = /class="format [^"]*">([^<]+)<\/div>/g;

const DESCRIPTION_PATTERN = /class="description">([\s\S]*?)<\/div>/;

const KEYWORDS_PATTERN = /class="keywords">([\s\S]*?)<\/div>/;

/**
 * Decodes the small set of HTML entities the portal emits and strips tags.
 *
 * @param value - Text taken from a catalogue page.
 * @returns Plain text with entities decoded and whitespace collapsed.
 */
function cleanHtmlText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
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
 * Splits a comma-separated keyword line into distinct non-empty keywords.
 *
 * @param value - Keyword text from the catalogue.
 * @returns Keywords in published order.
 */
function splitKeywords(value: string): string[] {
  return value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

/**
 * Parses one Environment Canterbury catalogue page into dataset records.
 *
 * The portal renders server-side HTML with no JSON catalogue endpoint, so
 * this reads the result count and each dataset rollup.
 *
 * @param payload - Raw HTML from `https://data.ecan.govt.nz/Catalogue/Search`.
 * @returns The page number, page size, catalogue total and dataset rows.
 * @throws {NzSourceParseError} When the payload is not a catalogue results page.
 */
export function parseEcanCataloguePage(payload: unknown): EcanCataloguePage {
  if (typeof payload !== 'string') {
    throw new NzSourceParseError('Environment Canterbury open data', 'expected an HTML string');
  }
  const totalMatch = TOTAL_PATTERN.exec(payload);
  if (totalMatch === null) {
    throw new NzSourceParseError(
      'Environment Canterbury open data',
      'payload is not a catalogue results page'
    );
  }
  const first = Number(totalMatch[1]);
  const last = Number(totalMatch[2]);
  const total = Number(totalMatch[3]);
  if (!Number.isFinite(first) || !Number.isFinite(last) || !Number.isFinite(total)) {
    throw new NzSourceParseError(
      'Environment Canterbury open data',
      'catalogue result count is not numeric'
    );
  }
  const pageSize = total === 0 ? 0 : last - first + 1;
  const page = pageSize === 0 ? 1 : Math.floor((first - 1) / pageSize) + 1;
  const lastPage = pageSize === 0 ? 0 : Math.ceil(total / pageSize);

  const datasets: EcanDataset[] = [];
  for (const match of payload.matchAll(ROLLUP_PATTERN)) {
    const block = match[1] ?? '';
    const link = METHOD_LINK_PATTERN.exec(block);
    if (link === null) {
      continue;
    }
    const methodId = Number(link[1]);
    if (!Number.isFinite(methodId)) {
      continue;
    }
    datasets.push({
      methodId,
      title: cleanHtmlText(link[2] ?? ''),
      description: cleanHtmlText(DESCRIPTION_PATTERN.exec(block)?.[1] ?? ''),
      keywords: splitKeywords(cleanHtmlText(KEYWORDS_PATTERN.exec(block)?.[1] ?? '')),
      formats: [...block.matchAll(FORMAT_PATTERN)].map((format) => cleanHtmlText(format[1] ?? '')),
      url: `https://data.ecan.govt.nz/Catalogue/Method?MethodId=${String(methodId)}`,
    });
  }
  if (total > 0 && datasets.length === 0) {
    throw new NzSourceParseError(
      'Environment Canterbury open data',
      'result count was positive but no datasets were found'
    );
  }
  return { page, pageSize, total, lastPage, datasets };
}

/**
 * Fetches one page of the Environment Canterbury catalogue. Keyless.
 *
 * @param page - One-based catalogue page number.
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns The requested catalogue page.
 * @throws {NzSourceApiError} When the portal is unreachable or rejects the request.
 */
export async function fetchEcanCataloguePage(
  page: number,
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<EcanCataloguePage> {
  const url = new URL(ECAN_CATALOGUE_URL);
  url.searchParams.set('page', String(page));
  const response = await httpGet('Environment Canterbury open data', url, { fetchImpl });
  return parseEcanCataloguePage(await response.text());
}

/**
 * Fetches every page of the Environment Canterbury catalogue. Keyless.
 *
 * The portal lists 10 datasets per page, so the first page's total sets the
 * number of requests. Duplicate method ids are dropped if the portal repeats
 * a dataset across pages.
 *
 * @param options - Fetch implementation override for tests.
 * @param options.fetchImpl - Fetch implementation to use instead of the global one.
 * @returns All catalogue datasets in published order.
 * @throws {NzSourceApiError} When the portal is unreachable or rejects a request.
 */
export async function fetchEcanDatasetCatalogue(
  options: { fetchImpl?: typeof globalThis.fetch } = {}
): Promise<EcanDatasetCatalogue> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const firstPage = await fetchEcanCataloguePage(1, fetchImpl);
  const byMethodId = new Map<number, EcanDataset>();
  for (const dataset of firstPage.datasets) {
    byMethodId.set(dataset.methodId, dataset);
  }
  for (let page = 2; page <= firstPage.lastPage; page += 1) {
    const nextPage = await fetchEcanCataloguePage(page, fetchImpl);
    for (const dataset of nextPage.datasets) {
      byMethodId.set(dataset.methodId, dataset);
    }
  }
  return { total: firstPage.total, datasets: [...byMethodId.values()] };
}

/**
 * Parses a dataset's JSON export into rows.
 *
 * Some retired datasets answer with `{"data":{"item":{"Msg":...}}}` instead
 * of a row list. That shape is rejected so a caller never receives a fake row.
 *
 * @param payload - Raw JSON from `https://data.ecan.govt.nz/data/<id>/JSON`.
 * @returns The dataset rows keyed by published column name.
 * @throws {NzSourceParseError} When the payload is not a dataset row list.
 */
export function parseEcanDatasetRows(payload: unknown): EcanDatasetRow[] {
  const parsed = ECAN_ROWS_RESPONSE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError(
      'Environment Canterbury open data',
      'payload is not a dataset row list; the dataset may need parameters or be retired'
    );
  }
  return parsed.data.data.item;
}

/**
 * Fetches one dataset's rows from its keyless JSON export.
 *
 * @param methodId - Catalogue method id, e.g. `23` for air quality sites.
 * @param options - Fetch implementation override for tests.
 * @param options.fetchImpl - Fetch implementation to use instead of the global one.
 * @returns The dataset rows keyed by published column name.
 * @throws {NzSourceApiError} When the portal is unreachable or rejects the request.
 * @throws {NzSourceParseError} When the dataset returns no row list.
 */
export async function fetchEcanDatasetRows(
  methodId: number,
  options: { fetchImpl?: typeof globalThis.fetch } = {}
): Promise<EcanDatasetRow[]> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const response = await httpGet(
    'Environment Canterbury open data',
    `${ECAN_DATA_URL}/${String(methodId)}/JSON`,
    { fetchImpl }
  );
  return parseEcanDatasetRows(await response.json());
}

/**
 * Environment Canterbury adapter: the first catalogue page, keyless.
 *
 * Use {@link fetchEcanDatasetCatalogue} when every page is needed, and
 * {@link fetchEcanDatasetRows} to read one dataset's JSON export.
 */
export const environmentCanterburyOpenDataAdapter: NzDataAdapter<EcanCataloguePage> = {
  id: ENVIRONMENT_CANTERBURY_OPEN_DATA_SOURCE_ID,
  name: 'Environment Canterbury open data',
  auth: 'none',
  description:
    'Catalogue of Environment Canterbury environmental monitoring datasets for Canterbury.',
  fetchLive: (options) => fetchEcanCataloguePage(1, options?.fetchImpl ?? globalThis.fetch),
  parse: parseEcanCataloguePage,
  loadFixture: () =>
    parseEcanCataloguePage(
      readFixtureText('environment-canterbury-open-data-catalogue-2026-11-18.html')
    ),
};
