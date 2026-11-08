import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { httpGet } from './http.js';

/** One downloadable representation of a DCAT dataset. */
export interface DcatDistribution {
  title: string;
  format: string;
  mediaType: string;
  accessUrl: string;
}

/** One dataset in a DCAT 1.1 catalogue feed. */
export interface DcatDataset {
  identifier: string;
  title: string;
  description: string;
  landingPage: string;
  keywords: string[];
  issued: string;
  modified: string;
  publisher: string;
  contactName: string;
  contactEmail: string;
  license: string;
  themes: string[];
  spatial: string;
  distributions: DcatDistribution[];
}

/** A DCAT 1.1 catalogue: dataset count plus the rows. */
export interface DcatCatalogue {
  count: number;
  datasets: DcatDataset[];
}

const DCAT_DISTRIBUTION_SCHEMA = z.object({
  title: z.coerce.string(),
  format: z.string(),
  mediaType: z.string(),
  accessURL: z.string(),
});

const DCAT_CONTACT_SCHEMA = z.object({
  fn: z.string(),
  hasEmail: z.string().optional().default(''),
});

const DCAT_DATASET_SCHEMA = z.object({
  '@type': z.literal('dcat:Dataset'),
  identifier: z.string(),
  title: z.coerce.string(),
  description: z.string().optional().default(''),
  landingPage: z.string().optional().default(''),
  keyword: z.array(z.string()).optional().default([]),
  issued: z.string().optional().default(''),
  modified: z.string().optional().default(''),
  publisher: z.object({ name: z.string() }).optional(),
  contactPoint: DCAT_CONTACT_SCHEMA.optional(),
  license: z.string().optional().default(''),
  theme: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default(''),
  spatial: z.string().optional().default(''),
  distribution: z.array(DCAT_DISTRIBUTION_SCHEMA).optional().default([]),
});

const DCAT_CATALOGUE_SCHEMA = z.object({
  '@type': z.literal('dcat:Catalog'),
  dataset: z.array(DCAT_DATASET_SCHEMA),
});

/**
 * Normalizes a DCAT theme, which feeds send as a list or a bare string.
 *
 * @param theme - Theme list, empty string, or a single theme name.
 * @returns Theme names with empty entries removed.
 */
function normalizeDcatThemes(theme: string | string[]): string[] {
  if (typeof theme === 'string') {
    return theme.length > 0 ? [theme] : [];
  }
  return theme.filter((name) => name.length > 0);
}

/**
 * Parses a DCAT 1.1 catalogue feed.
 *
 * @param payload - Raw JSON from a DCAT US 1.1 catalogue feed.
 * @param source - Source name used in parse errors, e.g. "NZTA open data".
 * @returns Catalogue datasets with their distributions and licence details.
 */
export function parseDcatCatalogue(payload: unknown, source: string): DcatCatalogue {
  const parsed = DCAT_CATALOGUE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError(source, parsed.error.message);
  }
  const datasets = parsed.data.dataset.map((dataset) => ({
    identifier: dataset.identifier,
    title: dataset.title,
    description: dataset.description,
    landingPage: dataset.landingPage,
    keywords: dataset.keyword,
    issued: dataset.issued,
    modified: dataset.modified,
    publisher: dataset.publisher?.name ?? '',
    contactName: dataset.contactPoint?.fn ?? '',
    contactEmail: (dataset.contactPoint?.hasEmail ?? '').replace(/^mailto:/i, ''),
    license: dataset.license,
    themes: normalizeDcatThemes(dataset.theme),
    spatial: dataset.spatial,
    distributions: dataset.distribution.map((distribution) => ({
      title: distribution.title,
      format: distribution.format,
      mediaType: distribution.mediaType,
      accessUrl: distribution.accessURL,
    })),
  }));
  return { count: datasets.length, datasets };
}

/**
 * Fetches and parses a DCAT 1.1 catalogue feed. Keyless; throws on an
 * unreachable API.
 *
 * @param source - Source name used in errors, e.g. "Christchurch open data".
 * @param url - DCAT feed URL.
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Catalogue datasets with their distributions and licence details.
 */
export async function fetchDcatCatalogue(
  source: string,
  url: string,
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<DcatCatalogue> {
  const response = await httpGet(source, url, { fetchImpl: fetchImpl });
  return parseDcatCatalogue(await response.json(), source);
}
