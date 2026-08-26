import { adeSearchAdapter } from "./adeSearch.js";
import { arcgisHubAdapter } from "./arcgisHub.js";
import { dataGovtDatastoreAdapter } from "./dataGovtDatastore.js";
import { dataGovtNzAdapter } from "./dataGovtNz.js";
import { digitalNzAdapter } from "./digitalNz.js";
import { geonetAdapter } from "./geonet.js";
import { lawaAdapter } from "./lawa.js";
import { linzAdapter } from "./linz.js";
import { lrisAdapter } from "./lris.js";
import { mfeAdapter } from "./mfe.js";
import { nzorAdapter } from "./nzor.js";
import { nztaAdapter } from "./nzta.js";
import { tradeMeAdapter } from "./tradeMe.js";
import type { NzDataAdapter, NzFetchOptions, NzSourceProbe } from "./types.js";

/** Every NZ data source behind the uniform adapter interface. */
export const NZ_DATA_SOURCES: NzDataAdapter<unknown>[] = [
  geonetAdapter,
  dataGovtNzAdapter,
  dataGovtDatastoreAdapter,
  adeSearchAdapter,
  digitalNzAdapter,
  tradeMeAdapter,
  nzorAdapter,
  linzAdapter,
  arcgisHubAdapter,
  lawaAdapter,
  mfeAdapter,
  lrisAdapter,
  nztaAdapter,
];

/** Looks up a source adapter by id. */
export function getNzDataSource<T>(id: string): NzDataAdapter<T> | undefined {
  return NZ_DATA_SOURCES.find((source) => source.id === id) as
    NzDataAdapter<T> | undefined;
}

/** Probes one source with a live fetch and reports the outcome. */
export async function probeNzDataSource<T>(
  adapter: NzDataAdapter<T>,
  options?: { apiKey?: string },
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
      status: "ok",
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

/** Probes every registered source in parallel, with optional per-source keys. */
export async function probeAllNzDataSources(options?: {
  apiKey?: string;
  apiKeys?: Record<string, string>;
}): Promise<NzSourceProbe[]> {
  const { apiKey, apiKeys } = options ?? {};
  return Promise.all(
    NZ_DATA_SOURCES.map((source) => {
      const key = apiKeys?.[source.id] ?? apiKey;
      return probeNzDataSource(
        source,
        key === undefined ? {} : { apiKey: key },
      );
    }),
  );
}
