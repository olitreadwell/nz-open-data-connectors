import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import { httpGet } from './http.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the EV Roam charging stations adapter. */
export const EV_ROAM_SOURCE_ID = 'ev-roam';

/** One public electric vehicle charging station in New Zealand. */
export interface EvRoamChargingStation {
  objectId: number;
  name: string;
  operator: string;
  owner: string;
  address: string;
  is24Hours: boolean;
  carParkCount: number | null;
  hasCarParkCost: boolean;
  maxTimeLimit: string;
  hasTouristAttraction: boolean;
  latitude: number;
  longitude: number;
  currentType: string;
  dateFirstOperational: string | null;
  numberOfConnectors: number | null;
  connectorsList: string;
  hasChargingCost: boolean;
}

/** All EV Roam charging stations returned by the feature service. */
export interface EvRoamResult {
  count: number;
  stations: EvRoamChargingStation[];
}

const NULLABLE_STRING = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? '');

const EV_ROAM_FEATURE_SCHEMA = z.object({
  attributes: z
    .object({
      OBJECTID: z.number(),
      name: NULLABLE_STRING,
      operator: NULLABLE_STRING,
      owner: NULLABLE_STRING,
      address: NULLABLE_STRING,
      is24Hours: NULLABLE_STRING,
      carParkCount: z.number().nullable().optional(),
      hasCarparkCost: NULLABLE_STRING,
      maxTimeLimit: NULLABLE_STRING,
      hasTouristAttraction: NULLABLE_STRING,
      latitude: z.number().nullable().optional(),
      longitude: z.number().nullable().optional(),
      currentType: NULLABLE_STRING,
      dateFirstOperational: z.number().nullable().optional(),
      numberOfConnectors: z.number().nullable().optional(),
      connectorsList: NULLABLE_STRING,
      hasChargingCost: NULLABLE_STRING,
    })
    .loose(),
  geometry: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .nullable()
    .optional(),
});

const EV_ROAM_RESPONSE_SCHEMA = z.object({
  features: z.array(EV_ROAM_FEATURE_SCHEMA),
});

function isTrue(value: string): boolean {
  return value.toLowerCase() === 'true';
}

function toIsoDate(timestamp: number | null | undefined): string | null {
  return timestamp === null || timestamp === undefined ? null : new Date(timestamp).toISOString();
}

function toStation(feature: z.infer<typeof EV_ROAM_FEATURE_SCHEMA>): EvRoamChargingStation {
  const attributes = feature.attributes;
  const geometry = feature.geometry;
  return {
    objectId: attributes.OBJECTID,
    name: attributes.name,
    operator: attributes.operator,
    owner: attributes.owner,
    address: attributes.address,
    is24Hours: isTrue(attributes.is24Hours),
    carParkCount: attributes.carParkCount ?? null,
    hasCarParkCost: isTrue(attributes.hasCarparkCost),
    maxTimeLimit: attributes.maxTimeLimit,
    hasTouristAttraction: isTrue(attributes.hasTouristAttraction),
    latitude: geometry?.y ?? attributes.latitude ?? 0,
    longitude: geometry?.x ?? attributes.longitude ?? 0,
    currentType: attributes.currentType,
    dateFirstOperational: toIsoDate(attributes.dateFirstOperational),
    numberOfConnectors: attributes.numberOfConnectors ?? null,
    connectorsList: attributes.connectorsList,
    hasChargingCost: isTrue(attributes.hasChargingCost),
  };
}

/**
 * Parses an ArcGIS FeatureServer response into EV Roam charging stations.
 *
 * @param payload - Raw JSON from the EV Roam feature service.
 * @returns The station count and station records.
 */
export function parseEvRoamChargingStations(payload: unknown): EvRoamResult {
  const parsed = EV_ROAM_RESPONSE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError('EV Roam', parsed.error.message);
  }
  const stations = parsed.data.features.map(toStation);
  return { count: stations.length, stations };
}

/**
 * Fetches public EV charging stations from NZTA's EV Roam feature service.
 * Keyless; returns the full published layer.
 *
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns The station count and station records.
 */
export async function fetchEvRoamChargingStations(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<EvRoamResult> {
  const url = new URL(
    'https://services.arcgis.com/CXBb7LAjgIIdcsPt/arcgis/rest/services/EV_Roam_charging_stations/FeatureServer/0/query'
  );
  url.searchParams.set('where', '1=1');
  url.searchParams.set('outFields', '*');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('outSR', '4326');
  url.searchParams.set('f', 'json');
  const response = await httpGet('EV Roam', url, { fetchImpl });
  return parseEvRoamChargingStations(await response.json());
}

/** EV Roam adapter: public EV charging stations, keyless. */
export const evRoamAdapter: NzDataAdapter<EvRoamResult> = {
  id: EV_ROAM_SOURCE_ID,
  name: 'EV Roam charging stations (NZTA)',
  auth: 'none',
  description: 'Public electric vehicle charging station locations and connector details.',
  fetchLive: (options) => fetchEvRoamChargingStations(options?.fetchImpl),
  parse: parseEvRoamChargingStations,
  loadFixture: () =>
    parseEvRoamChargingStations(readFixtureJson('ev-roam-charging-stations-2026-11-16.json')),
};
