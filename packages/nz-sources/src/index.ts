/** ADE search: find tables in the Aotearoa Data Explorer. */
export { searchAdeTables, parseAdeSearchResults, adeSearchAdapter } from './adeSearch.js';
/** ADE search types. */
export type { AdeDataflow, AdeSearchResult } from './adeSearch.js';
/** ArcGIS Hub open data catalogue and dataset search (keyless). */
export {
  parseArcgisHubCollections,
  parseArcgisHubDatasets,
  parseArcgisHubResult,
  fetchArcgisHubCollections,
  searchArcgisHubDatasets,
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
/** Auckland Transport open data hub catalogue (DCAT 1.1). */
export {
  fetchAucklandTransportOpenDataCatalogue,
  parseAucklandTransportOpenDataCatalogue,
  aucklandTransportOpenDataAdapter,
  AUCKLAND_TRANSPORT_OPEN_DATA_SOURCE_ID,
} from './aucklandTransportOpenData.js';
/** Auckland Transport open data types. */
export type {
  AucklandTransportOpenDataCatalogue,
  AucklandTransportOpenDataDataset,
  AucklandTransportOpenDataDistribution,
} from './aucklandTransportOpenData.js';
/** Canterbury Maps open data hub catalogue (DCAT 1.1). */
export {
  fetchCanterburyMapsCatalogue,
  parseCanterburyMapsCatalogue,
  canterburyMapsAdapter,
  CANTERBURY_MAPS_SOURCE_ID,
} from './canterburyMaps.js';
/** Canterbury Maps open data types. */
export type {
  CanterburyMapsCatalogue,
  CanterburyMapsDataset,
  CanterburyMapsDistribution,
} from './canterburyMaps.js';
/** Christchurch City open data hub catalogue (DCAT 1.1). */
export {
  fetchChristchurchOpenDataCatalogue,
  parseChristchurchOpenDataCatalogue,
  christchurchOpenDataAdapter,
  CHRISTCHURCH_OPEN_DATA_SOURCE_ID,
} from './christchurchOpenData.js';
/** Christchurch City open data types. */
export type {
  ChristchurchOpenDataCatalogue,
  ChristchurchOpenDataDataset,
  ChristchurchOpenDataDistribution,
} from './christchurchOpenData.js';
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
/** Electricity Authority downloadable dataset listing. */
export {
  fetchElectricityAuthorityDatasets,
  parseElectricityAuthorityDatasets,
  electricityAuthorityAdapter,
  ELECTRICITY_AUTHORITY_SOURCE_ID,
} from './electricityAuthority.js';
/** Electricity Authority dataset listing types. */
export type {
  ElectricityAuthorityDatasetListing,
  ElectricityAuthorityDatasetObject,
} from './electricityAuthority.js';
/** Errors shared by every source adapter. */
export { NzSourceApiError, NzSourceError, NzSourceParseError } from './errors.js';
/** API error detail type. */
export type { NzSourceApiErrorDetails } from './errors.js';
/** GeoNet felt earthquake data. */
export {
  fetchGeoNetFeltQuakes,
  parseGeoNetQuakes,
  summarizeGeoNetQuakes,
  geonetAdapter,
} from './geonet.js';
/** GeoNet types. */
export type { GeoNetQuake, GeoNetQuakeSummary } from './geonet.js';
/** Stats NZ Infoshare table catalogue search. */
export {
  searchInfoshareTables,
  parseInfoshareSearchResults,
  infoshareAdapter,
} from './infoshare.js';
/** Stats NZ Infoshare types. */
export type { InfoshareSearchResult, InfoshareTable } from './infoshare.js';
/** LINZ layer search. */
export { searchLinzLayers, parseLinzLayers, linzAdapter } from './linz.js';
/** LINZ types. */
export type { LinzLayer } from './linz.js';
/** LAWA river quality monitoring sites. */
export { fetchLawaRiverQualitySites, parseLawaRiverQualitySites, lawaAdapter } from './lawa.js';
/** LAWA types. */
export type { LawaRiverQualitySite } from './lawa.js';
/** LRIS land and soil layer search. */
export { searchLrisLayers, parseLrisLayers, lrisAdapter } from './lris.js';
/** LRIS types. */
export type { LrisLayer } from './lris.js';
/** LRIS topographic basemaps WMS capabilities. */
export {
  fetchLrisBasemaps,
  parseLrisBasemaps,
  lrisBasemapsAdapter,
  LRIS_BASEMAPS_SOURCE_ID,
} from './lrisBasemaps.js';
/** MBIE datasets in the national open data catalogue. */
export {
  fetchMbieOpenDataDatasets,
  parseMbieOpenDataDatasets,
  mbieOpenDataAdapter,
  MBIE_OPEN_DATA_ORGANIZATION,
  MBIE_OPEN_DATA_SOURCE_ID,
} from './mbieOpenData.js';
/** MBIE open data types. */
export type {
  MbieOpenDataDataset,
  MbieOpenDataResource,
  MbieOpenDataSearchResult,
} from './mbieOpenData.js';
/** MfE Data Service layer catalogue. */
export { searchMfeLayers, parseMfeLayers, mfeAdapter } from './mfe.js';
/** MfE types. */
export type { MfeLayer } from './mfe.js';
/** NIWA River Environment Classification WMS capabilities. */
export {
  fetchNiwaRecCapabilities,
  parseNiwaRecCapabilities,
  niwaRecAdapter,
  NIWA_REC_SOURCE_ID,
} from './niwaRec.js';
/** NZOR (New Zealand Organisms Register) name search. */
export { searchNzorNames, parseNzorNames, nzorAdapter } from './nzor.js';
/** NZOR types. */
export type { NzorName, NzorSearchResult } from './nzor.js';
/** NZPAM Geodata Catalogue public ArcGIS services. */
export {
  fetchNzpamGeodataServices,
  parseNzpamGeodataServices,
  nzpamGeodataAdapter,
  NZPAM_GEODATA_SOURCE_ID,
} from './nzpamGeodata.js';
/** NZPAM Geodata Catalogue types. */
export type { NzpamGeodataCatalogue, NzpamGeodataService } from './nzpamGeodata.js';
/** Waka Kotahi holiday journey hotspots. */
export { fetchNztaHolidayHotspots, parseNztaHolidayHotspots, nztaAdapter } from './nzta.js';
/** Waka Kotahi types. */
export type { NztaHolidayHotspot } from './nzta.js';
/** Waka Kotahi (NZTA) open data hub catalogue (DCAT 1.1). */
export {
  fetchNztaOpenDataCatalogue,
  parseNztaOpenDataCatalogue,
  nztaOpenDataAdapter,
  NZTA_OPEN_DATA_SOURCE_ID,
} from './nztaOpenData.js';
/** Waka Kotahi open data types. */
export type {
  NztaOpenDataCatalogue,
  NztaOpenDataDataset,
  NztaOpenDataDistribution,
} from './nztaOpenData.js';
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
/** Wellington City open data hub catalogue (DCAT 1.1). */
export {
  fetchWellingtonCityOpenDataCatalogue,
  parseWellingtonCityOpenDataCatalogue,
  wellingtonCityOpenDataAdapter,
  WELLINGTON_CITY_OPEN_DATA_SOURCE_ID,
} from './wellingtonCityOpenData.js';
/** Wellington City open data types. */
export type {
  WellingtonCityOpenDataCatalogue,
  WellingtonCityOpenDataDataset,
  WellingtonCityOpenDataDistribution,
} from './wellingtonCityOpenData.js';
/** Stats NZ Geographic Data Service layer search. */
export {
  searchStatsNzGeographicLayers,
  fetchStatsNzGeographicLayers,
  parseStatsNzGeographicLayers,
  statsNzGeographicAdapter,
  STATS_NZ_GEOGRAPHIC_SOURCE_ID,
} from './statsNzGeographic.js';
/** Stats NZ Geographic Data Service types. */
export type { StatsNzGeographicLayer } from './statsNzGeographic.js';
/** Whanganui District Council GeoNode dataset catalogue. */
export {
  fetchWhanganuiGeoNodeDatasets,
  parseWhanganuiGeoNodeDatasets,
  whanganuiGeospatialAdapter,
  WHANGANUI_GEOSPATIAL_SOURCE_ID,
} from './whanganuiGeospatial.js';
/** Whanganui GeoNode types. */
export type {
  WhanganuiGeoNodeDataset,
  WhanganuiGeoNodeExtent,
  WhanganuiGeoNodeResult,
} from './whanganuiGeospatial.js';
/** Shared DCAT 1.1 catalogue parser. */
export { parseDcatCatalogue, fetchDcatCatalogue } from './dcatCatalogue.js';
/** Shared DCAT 1.1 catalogue types. */
export type { DcatCatalogue, DcatDataset, DcatDistribution } from './dcatCatalogue.js';
/** Shared OGC WMS capabilities parser. */
export { parseWmsCapabilities } from './wmsCapabilities.js';
/** Shared OGC WMS capabilities types. */
export type { WmsCapabilities, WmsGeographicBounds, WmsLayer } from './wmsCapabilities.js';
/** API key normalization shared by adapters, the API, and the CLI. */
export { normalizeSourceApiKey } from './apiKey.js';
/** The shared HTTP layer every adapter fetch goes through. */
export { httpGet, httpPost, USER_AGENT, DEFAULT_TIMEOUT_MS } from './http.js';
/** Shared HTTP layer types. */
export type { HttpGetOptions, HttpPostOptions } from './http.js';
/** Shared adapter contract types. */
export type { NzDataAdapter, NzFetchOptions, NzSourceAuth, NzSourceProbe } from './types.js';
