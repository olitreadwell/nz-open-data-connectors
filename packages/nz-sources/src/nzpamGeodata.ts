import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import { httpGet } from './http.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the NZPAM Geodata Catalogue adapter. */
export const NZPAM_GEODATA_SOURCE_ID = 'nzpam-geodata';

const NZPAM_GEODATA_SERVICES_URL = 'https://gis.nzpam.govt.nz/server/rest/services/Public?f=pjson';

const NZPAM_SERVICE_SCHEMA = z.object({
  name: z.string(),
  type: z.string(),
});

const NZPAM_FOLDER_SCHEMA = z.object({
  currentVersion: z.union([z.string(), z.number()]).transform(String),
  folders: z.array(z.string()).optional().default([]),
  services: z.array(NZPAM_SERVICE_SCHEMA),
});

/** One public service advertised by the NZPAM ArcGIS REST server. */
export interface NzpamGeodataService {
  name: string;
  type: string;
}

/** The public NZPAM ArcGIS REST service catalogue. */
export interface NzpamGeodataCatalogue {
  currentVersion: string;
  folders: string[];
  services: NzpamGeodataService[];
}

/**
 * Parses the public NZPAM ArcGIS REST services folder.
 *
 * @param payload - Raw JSON from the `Public` services folder.
 * @returns The server version, subfolders, and named services.
 */
export function parseNzpamGeodataServices(payload: unknown): NzpamGeodataCatalogue {
  const parsed = NZPAM_FOLDER_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError('NZPAM Geodata Catalogue', parsed.error.message);
  }
  return parsed.data;
}

/**
 * Fetches the public NZPAM ArcGIS REST services folder. Keyless; throws on an
 * unreachable API.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns The server version, subfolders, and named services.
 */
export async function fetchNzpamGeodataServices(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<NzpamGeodataCatalogue> {
  const response = await httpGet('NZPAM Geodata Catalogue', NZPAM_GEODATA_SERVICES_URL, {
    fetchImpl: fetchImpl,
  });
  return parseNzpamGeodataServices(await response.json());
}

/** NZPAM adapter: public ArcGIS REST geodata services, keyless. */
export const nzpamGeodataAdapter: NzDataAdapter<NzpamGeodataCatalogue> = {
  id: NZPAM_GEODATA_SOURCE_ID,
  name: 'NZPAM Geodata Catalogue',
  auth: 'none',
  description: 'Public petroleum and minerals geospatial services from the NZPAM ArcGIS server.',
  fetchLive: (options) => fetchNzpamGeodataServices(options?.fetchImpl),
  parse: parseNzpamGeodataServices,
  loadFixture: () =>
    parseNzpamGeodataServices(readFixtureJson('nzpam-geodata-services-2026-11-08.json')),
};
