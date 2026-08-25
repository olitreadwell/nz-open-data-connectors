/** ADE search: find tables in the Aotearoa Data Explorer. */
export {
  searchAdeTables,
  parseAdeSearchResults,
  adeSearchAdapter,
} from "./adeSearch";
/** ADE search types. */
export type { AdeDataflow, AdeSearchResult } from "./adeSearch";
/** data.govt.nz dataset search. */
export {
  searchDataGovtNzDatasets,
  parseDataGovtNzDatasets,
  dataGovtNzAdapter,
} from "./dataGovtNz";
/** data.govt.nz dataset search types. */
export type { DataGovtNzDataset, DataGovtNzSearchResult } from "./dataGovtNz";
/** data.govt.nz datastore rows (MSD benefits). */
export {
  fetchDataGovtDatastoreRows,
  parseDataGovtDatastoreRows,
  dataGovtDatastoreAdapter,
  MSD_BENEFIT_RESOURCE_ID,
} from "./dataGovtDatastore";
/** Datastore row types. */
export type {
  DataGovtDatastoreResult,
  DataGovtDatastoreRow,
} from "./dataGovtDatastore";
/** DigitalNZ record search. */
export {
  searchDigitalNzRecords,
  parseDigitalNzRecords,
  digitalNzAdapter,
} from "./digitalNz";
/** DigitalNZ record types. */
export type { DigitalNzRecord } from "./digitalNz";
/** Errors shared by every source adapter. */
export { NzSourceApiError, NzSourceError, NzSourceParseError } from "./errors";
/** GeoNet felt earthquake data. */
export {
  fetchGeoNetFeltQuakes,
  parseGeoNetQuakes,
  summarizeGeoNetQuakes,
  geonetAdapter,
} from "./geonet";
/** GeoNet types. */
export type { GeoNetQuake, GeoNetQuakeSummary } from "./geonet";
/** LINZ layer search. */
export { searchLinzLayers, parseLinzLayers, linzAdapter } from "./linz";
/** LINZ types. */
export type { LinzLayer } from "./linz";
/** NZOR (New Zealand Organisms Register) name search. */
export { searchNzorNames, parseNzorNames, nzorAdapter } from "./nzor";
/** NZOR types. */
export type { NzorName, NzorSearchResult } from "./nzor";
/** The uniform adapter registry and probe helpers. */
export {
  NZ_DATA_SOURCES,
  getNzDataSource,
  probeAllNzDataSources,
  probeNzDataSource,
} from "./registry";
/** Trade Me category data. */
export {
  fetchTradeMeCategories,
  parseTradeMeCategories,
  tradeMeAdapter,
} from "./tradeMe";
/** Trade Me types. */
export type { TradeMeCategory } from "./tradeMe";
/** Shared adapter contract types. */
export type {
  NzDataAdapter,
  NzFetchOptions,
  NzSourceAuth,
  NzSourceProbe,
} from "./types";
