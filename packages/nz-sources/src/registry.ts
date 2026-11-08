import { adeSearchAdapter } from './adeSearch.js';
import { arcgisHubAdapter } from './arcgisHub.js';
import { aucklandTransportOpenDataAdapter } from './aucklandTransportOpenData.js';
import { canterburyMapsAdapter } from './canterburyMaps.js';
import { christchurchOpenDataAdapter } from './christchurchOpenData.js';
import { dataGovtDatastoreAdapter } from './dataGovtDatastore.js';
import { dataGovtNzAdapter } from './dataGovtNz.js';
import { digitalNzAdapter } from './digitalNz.js';
import { electricityAuthorityAdapter } from './electricityAuthority.js';
import { geonetAdapter } from './geonet.js';
import { infoshareAdapter } from './infoshare.js';
import { lawaAdapter } from './lawa.js';
import { linzAdapter } from './linz.js';
import { lrisAdapter } from './lris.js';
import { lrisBasemapsAdapter } from './lrisBasemaps.js';
import { mbieOpenDataAdapter } from './mbieOpenData.js';
import { mfeAdapter } from './mfe.js';
import { niwaRecAdapter } from './niwaRec.js';
import { nzorAdapter } from './nzor.js';
import { nzpamGeodataAdapter } from './nzpamGeodata.js';
import { nztaAdapter } from './nzta.js';
import { nztaOpenDataAdapter } from './nztaOpenData.js';
import { statsNzGeographicAdapter } from './statsNzGeographic.js';
import { tradeMeAdapter } from './tradeMe.js';
import { wellingtonCityOpenDataAdapter } from './wellingtonCityOpenData.js';
import { whanganuiGeospatialAdapter } from './whanganuiGeospatial.js';
import type { NzDataAdapter, NzFetchOptions, NzSourceProbe } from './types.js';

/** Every NZ data source behind the uniform adapter interface. */
export const NZ_DATA_SOURCES: NzDataAdapter<unknown>[] = [
  geonetAdapter,
  dataGovtNzAdapter,
  dataGovtDatastoreAdapter,
  adeSearchAdapter,
  infoshareAdapter,
  digitalNzAdapter,
  tradeMeAdapter,
  nzorAdapter,
  linzAdapter,
  arcgisHubAdapter,
  lawaAdapter,
  mbieOpenDataAdapter,
  mfeAdapter,
  lrisAdapter,
  lrisBasemapsAdapter,
  niwaRecAdapter,
  statsNzGeographicAdapter,
  whanganuiGeospatialAdapter,
  christchurchOpenDataAdapter,
  aucklandTransportOpenDataAdapter,
  nztaAdapter,
  nztaOpenDataAdapter,
  canterburyMapsAdapter,
  wellingtonCityOpenDataAdapter,
  electricityAuthorityAdapter,
  nzpamGeodataAdapter,
];

/** Looks up a source adapter by id. */
export function getNzDataSource<T>(id: string): NzDataAdapter<T> | undefined {
  return NZ_DATA_SOURCES.find((source) => source.id === id) as NzDataAdapter<T> | undefined;
}

/** Probes one source with a live fetch and reports the outcome. */
export async function probeNzDataSource<T>(
  adapter: NzDataAdapter<T>,
  options?: { apiKey?: string }
): Promise<NzSourceProbe> {
  try {
    const fetchOptions: NzFetchOptions =
      options?.apiKey === undefined ? {} : { apiKey: options.apiKey };
    const data = await adapter.fetchLive(fetchOptions);
    return {
      id: adapter.id,
      name: adapter.name,
      auth: adapter.auth,
      ok: true,
      status: 'ok',
      sample: JSON.stringify(data).slice(0, 120),
    };
  } catch (error) {
    return {
      id: adapter.id,
      name: adapter.name,
      auth: adapter.auth,
      ok: false,
      status: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Probes the requested sources in parallel, with optional per-source keys. */
export async function probeAllNzDataSources(options?: {
  apiKey?: string;
  apiKeys?: Record<string, string>;
  ids?: string[];
}): Promise<NzSourceProbe[]> {
  const { apiKey, apiKeys, ids } = options ?? {};
  if (ids !== undefined) {
    const known = new Set(NZ_DATA_SOURCES.map((source) => source.id));
    const unknown = [...new Set(ids.filter((id) => !known.has(id)))];
    if (unknown.length > 0) {
      const noun = unknown.length === 1 ? 'id' : 'ids';
      const list = unknown.map((id) => `"${id}"`).join(', ');
      throw new Error(`Unknown NZ source ${noun} ${list}. Call list_sources for the ids.`);
    }
  }
  const wanted = ids === undefined ? undefined : new Set(ids);
  return Promise.all(
    NZ_DATA_SOURCES.filter((source) => wanted === undefined || wanted.has(source.id)).map(
      (source) => {
        const key = apiKeys?.[source.id] ?? apiKey;
        return probeNzDataSource(source, key === undefined ? {} : { apiKey: key });
      }
    )
  );
}
