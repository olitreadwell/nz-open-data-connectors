/** ADE search: find tables in the Aotearoa Data Explorer. */
export { searchAdeTables, parseAdeSearchResults, adeSearchAdapter } from './adeSearch.js';
/** ADE search types. */
export type { AdeDataflow, AdeSearchResult } from './adeSearch.js';
/** ArcGIS Hub open data catalogue and dataset search (keyless). */
export {
  parseArcgisHubCollections,
  parseArcgisHubDatasets,
  parseArcgisHubResult,
  normalizeArcgisHubHost,
  arcgisHubAdapter,
  DEFAULT_ARCGIS_HUB_HOST,
} from './arcgisHub.js';
/** ArcGIS Hub types. */
export type {
  ArcgisHubCollection,
  ArcgisHubDataset,
  ArcgisHubFetchOptions,
  ArcgisHubResult,
} from './arcgisHub.js';
/** data.govt.nz dataset search. */
export {
  searchDataGovtNzDatasets,
  parseDataGovtNzDatasets,
  dataGovtNzAdapter,
} from './dataGovtNz.js';
/** data.govt.nz dataset search types. */
export type { DataGovtNzDataset, DataGovtNzSearchResult } from './dataGovtNz.js';
/** data.govt.nz datastore rows (MSD benefits). */
export {
  fetchDataGovtDatastoreRows,
  parseDataGovtDatastoreRows,
  dataGovtDatastoreAdapter,
  MSD_BENEFIT_RESOURCE_ID,
} from './dataGovtDatastore.js';
/** Datastore row types. */
export type { DataGovtDatastoreResult, DataGovtDatastoreRow } from './dataGovtDatastore.js';
/** DigitalNZ record and media search. */
export {
  searchDigitalNzRecords,
  searchDigitalNzMedia,
  getDigitalNzCategoryFilter,
  DIGITAL_NZ_MEDIA_TYPES,
  parseDigitalNzRecords,
  digitalNzAdapter,
} from './digitalNz.js';
/** DigitalNZ record and media types. */
export type { DigitalNzRecord, DigitalNzMediaType } from './digitalNz.js';
/** Errors shared by every source adapter. */
export { NzSourceApiError, NzSourceError, NzSourceParseError } from './errors.js';
/** GeoNet felt earthquake data. */
export {
  fetchGeoNetFeltQuakes,
  parseGeoNetQuakes,
  summarizeGeoNetQuakes,
  geonetAdapter,
} from './geonet.js';
/** GeoNet types. */
export type { GeoNetQuake, GeoNetQuakeSummary } from './geonet.js';
/** LINZ layer search. */
export { searchLinzLayers, parseLinzLayers, linzAdapter } from './linz.js';
/** LINZ types. */
export type { LinzLayer } from './linz.js';
/** LAWA river quality monitoring sites. */
export { parseLawaRiverQualitySites, lawaAdapter } from './lawa.js';
/** LAWA types. */
export type { LawaRiverQualitySite } from './lawa.js';
/** LRIS land and soil layer search. */
export { parseLrisLayers, lrisAdapter } from './lris.js';
/** LRIS types. */
export type { LrisLayer } from './lris.js';
/** MfE Data Service layer catalogue. */
export { parseMfeLayers, mfeAdapter } from './mfe.js';
/** MfE types. */
export type { MfeLayer } from './mfe.js';
/** NZOR (New Zealand Organisms Register) name search. */
export { searchNzorNames, parseNzorNames, nzorAdapter } from './nzor.js';
/** NZOR types. */
export type { NzorName, NzorSearchResult } from './nzor.js';
/** Waka Kotahi holiday journey hotspots. */
export { parseNztaHolidayHotspots, nztaAdapter } from './nzta.js';
/** Waka Kotahi types. */
export type { NztaHolidayHotspot } from './nzta.js';
/** The uniform adapter registry and probe helpers. */
export {
  NZ_DATA_SOURCES,
  getNzDataSource,
  probeAllNzDataSources,
  probeNzDataSource,
} from './registry.js';
/** Trade Me category data. */
export { fetchTradeMeCategories, parseTradeMeCategories, tradeMeAdapter } from './tradeMe.js';
/** Trade Me types. */
export type { TradeMeCategory } from './tradeMe.js';
/** Shared adapter contract types. */
export type { NzDataAdapter, NzFetchOptions, NzSourceAuth, NzSourceProbe } from './types.js';
