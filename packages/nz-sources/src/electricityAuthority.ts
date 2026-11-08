import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { readFixtureText } from './fixtures.js';
import { httpGet } from './http.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Electricity Authority downloadable datasets adapter. */
export const ELECTRICITY_AUTHORITY_SOURCE_ID = 'electricity-authority';

const ELECTRICITY_AUTHORITY_LIST_URL =
  'https://emidatasets.blob.core.windows.net/publicdata?restype=container&comp=list';

const XML_PARSER = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});

const BLOB_PROPERTIES_SCHEMA = z.object({
  'Last-Modified': z.string(),
  Etag: z.string().optional().default(''),
  'Content-Length': z.union([z.string(), z.number()]).optional().default('0'),
  'Content-Type': z.string().optional().default(''),
});

const BLOB_SCHEMA = z.object({
  Name: z.string(),
  Url: z.string(),
  Properties: BLOB_PROPERTIES_SCHEMA,
});

const ENUMERATION_SCHEMA = z.object({
  '@_ContainerName': z.string(),
  Blobs: z
    .object({
      Blob: z
        .union([BLOB_SCHEMA, z.array(BLOB_SCHEMA)])
        .optional()
        .default([]),
    })
    .optional(),
  NextMarker: z.string().optional().default(''),
});

/** One object in the Electricity Authority public dataset container. */
export interface ElectricityAuthorityDatasetObject {
  name: string;
  url: string;
  lastModified: string;
  etag: string;
  contentLength: number;
  contentType: string;
}

/** One page of the Electricity Authority public dataset container. */
export interface ElectricityAuthorityDatasetListing {
  container: string;
  objects: ElectricityAuthorityDatasetObject[];
  nextMarker: string;
}

/**
 * Reads one required string from an XML node.
 *
 * @param value - XML node value.
 * @param field - Field name used in the error message.
 * @param source - Source name used in the error message.
 * @returns The string value.
 */
function readXmlString(value: unknown, field: string, source: string): string {
  if (typeof value !== 'string') {
    throw new NzSourceParseError(source, `invalid ${field} in container listing`);
  }
  return value;
}

/**
 * Reads a content length from the XML string form Azure returns.
 *
 * @param value - Content-Length value.
 * @param source - Source name used in the error message.
 * @returns The byte length as a number.
 */
function readContentLength(value: string | number, source: string): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new NzSourceParseError(source, 'invalid Content-Length in container listing');
  }
  return parsed;
}

/**
 * Parses an Azure Blob container listing into dataset objects.
 *
 * @param payload - Raw XML from the Electricity Authority public container.
 * @returns Container URL, objects, and the marker for the next page.
 */
export function parseElectricityAuthorityDatasets(
  payload: string
): ElectricityAuthorityDatasetListing {
  const source = 'Electricity Authority datasets';
  const parsed: unknown = XML_PARSER.parse(payload);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new NzSourceParseError(source, 'invalid container listing XML');
  }
  const root = ENUMERATION_SCHEMA.safeParse((parsed as Record<string, unknown>).EnumerationResults);
  if (!root.success) {
    throw new NzSourceParseError(source, root.error.message);
  }
  const blobNodes = root.data.Blobs?.Blob ?? [];
  const blobs = Array.isArray(blobNodes) ? blobNodes : [blobNodes];
  return {
    container: root.data['@_ContainerName'],
    objects: blobs.map((blob) => ({
      name: readXmlString(blob.Name, 'Name', source),
      url: readXmlString(blob.Url, 'Url', source),
      lastModified: readXmlString(blob.Properties['Last-Modified'], 'Last-Modified', source),
      etag: blob.Properties.Etag,
      contentLength: readContentLength(blob.Properties['Content-Length'], source),
      contentType: blob.Properties['Content-Type'],
    })),
    nextMarker: root.data.NextMarker,
  };
}

/**
 * Fetches the first page of the Electricity Authority public dataset
 * container. Keyless; throws on an unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Container URL, objects, and the marker for the next page.
 */
export async function fetchElectricityAuthorityDatasets(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<ElectricityAuthorityDatasetListing> {
  const response = await httpGet('Electricity Authority datasets', ELECTRICITY_AUTHORITY_LIST_URL, {
    fetchImpl: fetchImpl,
  });
  return parseElectricityAuthorityDatasets(await response.text());
}

/** Electricity Authority adapter: public downloadable dataset listing, keyless. */
export const electricityAuthorityAdapter: NzDataAdapter<ElectricityAuthorityDatasetListing> = {
  id: ELECTRICITY_AUTHORITY_SOURCE_ID,
  name: 'Electricity Authority downloadable datasets',
  auth: 'none',
  description: 'First page of the public Electricity Authority dataset container listing.',
  fetchLive: (options) => fetchElectricityAuthorityDatasets(options?.fetchImpl),
  parse: (payload) => parseElectricityAuthorityDatasets(String(payload)),
  loadFixture: () =>
    parseElectricityAuthorityDatasets(
      readFixtureText('electricity-authority-datasets-2026-11-08.xml')
    ),
};
