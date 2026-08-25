/** ADE search: find tables in the Aotearoa Data Explorer. */
export {
  searchAdeTables,
  parseAdeSearchResults,
  adeSearchAdapter,
} from "./adeSearch.js";
/** ADE search types. */
export type { AdeDataflow, AdeSearchResult } from "./adeSearch.js";
/** data.govt.nz dataset search. */
export {
  searchDataGovtNzDatasets,
  parseDataGovtNzDatasets,
  dataGovtNzAdapter,
} from "./dataGovtNz.js";
/** data.govt.nz dataset search types. */
export type {
  DataGovtNzDataset,
  DataGovtNzSearchResult,
} from "./dataGovtNz.js";
/** data.govt.nz datastore rows (MSD benefits). */
export {
  fetchDataGovtDatastoreRows,
  parseDataGovtDatastoreRows,
  dataGovtDatastoreAdapter,
  MSD_BENEFIT_RESOURCE_ID,
} from "./dataGovtDatastore.js";
/** Datastore row types. */
export type {
  DataGovtDatastoreResult,
  DataGovtDatastoreRow,
} from "./dataGovtDatastore.js";
/** DigitalNZ record search. */
export {
  searchDigitalNzRecords,
  parseDigitalNzRecords,
  digitalNzAdapter,
} from "./digitalNz.js";
/** DigitalNZ record types. */
export type { DigitalNzRecord } from "./digitalNz.js";
/** Errors shared by every source adapter. */
export {
  NzSourceApiError,
  NzSourceError,
  NzSourceParseError,
} from "./errors.js";
/** GeoNet felt earthquake data. */
export {
  fetchGeoNetFeltQuakes,
  parseGeoNetQuakes,
  summarizeGeoNetQuakes,
  geonetAdapter,
} from "./geonet.js";
/** GeoNet types. */
export type { GeoNetQuake, GeoNetQuakeSummary } from "./geonet.js";
/** LINZ layer search. */
export { searchLinzLayers, parseLinzLayers, linzAdapter } from "./linz.js";
/** LINZ types. */
export type { LinzLayer } from "./linz.js";
/** NZOR (New Zealand Organisms Register) name search. */
export { searchNzorNames, parseNzorNames, nzorAdapter } from "./nzor.js";
/** NZOR types. */
export type { NzorName, NzorSearchResult } from "./nzor.js";
/** The uniform adapter registry and probe helpers. */
export {
  NZ_DATA_SOURCES,
  getNzDataSource,
  probeAllNzDataSources,
  probeNzDataSource,
} from "./registry.js";
/** Trade Me category data. */
export {
  fetchTradeMeCategories,
  parseTradeMeCategories,
  tradeMeAdapter,
} from "./tradeMe.js";
/** Trade Me types. */
export type { TradeMeCategory } from "./tradeMe.js";
/** Shared adapter contract types. */
export type {
  NzDataAdapter,
  NzFetchOptions,
  NzSourceAuth,
  NzSourceProbe,
} from "./types.js";
