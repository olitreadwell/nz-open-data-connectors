import {
  DIGITAL_NZ_MEDIA_TYPES,
  fetchLawaRiverQualitySites,
  fetchArcgisHubCollections,
  fetchDataGovtDatastoreRows,
  fetchGeoNetFeltQuakes,
  fetchNztaHolidayHotspots,
  fetchNztaOpenDataCatalogue,
  fetchTradeMeCategories,
  getNzDataSource,
  NZ_DATA_SOURCES,
  probeAllNzDataSources,
  searchAdeTables,
  searchArcgisHubDatasets,
  searchDataGovtNzDatasets,
  searchDigitalNzMedia,
  searchDigitalNzRecords,
  searchLinzLayers,
  searchLrisLayers,
  searchMfeLayers,
  searchNzorNames,
} from '@nz-open-data-connectors/nz-sources';
import { createStatsNzClient } from '@nz-open-data-connectors/stats-nz';
import type { StatsNzDataFormat } from '@nz-open-data-connectors/stats-nz';
import type { DigitalNzMediaType } from '@nz-open-data-connectors/nz-sources';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { createSourceMcpServer, type SourceQueryTool } from './createSourceMcpServer.js';
import { readPackageVersion } from './packageVersion.js';

/** What this server calls itself in the MCP handshake. */
export const NZ_MCP_SERVER_NAME = 'nz-open-data';

/** Version reported in the MCP handshake, read from package.json. */
export const NZ_MCP_SERVER_VERSION = readPackageVersion();

const STATS_NZ_FORMATS = ['csv', 'csvfilewithlabels', 'jsondata'] as const;

/** The named-function tools the NZ library can answer. */
const NZ_QUERY_TOOLS: SourceQueryTool[] = [
  {
    name: 'nz_felt_earthquakes',
    title: 'Recent felt earthquakes',
    description:
      'Recent felt earthquakes from GeoNet, filtered to a minimum Modified Mercalli intensity. Keyless. Returns GeoJSON features, newest first.',
    inputSchema: {
      minMmi: z
        .number()
        .int()
        .min(1)
        .max(8)
        .optional()
        .describe('Minimum Modified Mercalli intensity, 1 to 8. Defaults to 3.'),
    },
    run: async (args) =>
      fetchGeoNetFeltQuakes(typeof args.minMmi === 'number' ? args.minMmi : undefined),
  },
  {
    name: 'nz_datastore_rows',
    title: 'data.govt.nz datastore rows',
    description:
      'Reads rows from one resource in the data.govt.nz CKAN datastore. Keyless. Pass the resource id, which appears at the end of a catalogue dataset URL.',
    inputSchema: {
      resourceId: z.string().describe('CKAN resource id, for example 4f0d1e2c-....'),
      limit: z.number().int().min(1).max(10_000).optional().describe('Row cap. Defaults to 1000.'),
    },
    run: async (args) =>
      fetchDataGovtDatastoreRows(
        String(args.resourceId),
        typeof args.limit === 'number' ? { limit: args.limit } : {}
      ),
  },
  {
    name: 'nz_trademe_categories',
    title: 'Trade Me category tree',
    description: 'The public Trade Me category tree, keyless. Useful for classifying listings.',
    inputSchema: {},
    run: async () => fetchTradeMeCategories(),
  },
  {
    name: 'nz_ade_search',
    title: 'Search ADE tables',
    description:
      'Searches the Aotearoa Data Explorer table index by keyword and returns matching dataflow ids, versions, and dimensions. Keyless.',
    inputSchema: {
      query: z.string().describe('Keyword search, for example median annual earnings.'),
      limit: z.number().int().min(1).max(100).optional().describe('Result cap. Defaults to 20.'),
    },
    run: async (args) => {
      const limit = typeof args.limit === 'number' ? args.limit : undefined;
      return searchAdeTables(String(args.query), limit === undefined ? {} : { limit });
    },
  },
  {
    name: 'nz_data_govt_search',
    title: 'Search data.govt.nz',
    description:
      'Searches the data.govt.nz catalogue by keyword and returns dataset names, titles, and organisations. Keyless.',
    inputSchema: { query: z.string().describe('Keyword search.') },
    run: async (args) => searchDataGovtNzDatasets(String(args.query)),
  },
  {
    name: 'nz_digitalnz_records',
    title: 'Search DigitalNZ records',
    description:
      'Searches DigitalNZ across every collection and returns record metadata. Keyless for a small number of requests; pass apiKey for a key.',
    inputSchema: {
      query: z.string().describe('Keyword search.'),
      apiKey: z.string().optional().describe('DigitalNZ API key.'),
    },
    run: async (args) => {
      const apiKey = stringOrUndefined(args.apiKey);
      return searchDigitalNzRecords(String(args.query), apiKey === undefined ? {} : { apiKey });
    },
  },
  {
    name: 'nz_digitalnz_media',
    title: 'Search DigitalNZ media',
    description:
      'Searches DigitalNZ within one media category, which narrows results better than a text query alone. Keyless for a small number of requests; pass apiKey for a key.',
    inputSchema: {
      query: z.string().describe('Keyword search.'),
      mediaType: z.enum(DIGITAL_NZ_MEDIA_TYPES).describe('Media category to search.'),
      apiKey: z.string().optional().describe('DigitalNZ API key.'),
    },
    run: async (args) => {
      const apiKey = stringOrUndefined(args.apiKey);
      return searchDigitalNzMedia(
        String(args.query),
        String(args.mediaType) as DigitalNzMediaType,
        apiKey === undefined ? {} : { apiKey }
      );
    },
  },
  {
    name: 'nz_linz_layers',
    title: 'Search LINZ layers',
    description:
      'Searches the LINZ Data Service layer catalogue by keyword. Keyless; pass apiKey for higher limits.',
    inputSchema: {
      query: z.string().describe('Keyword search.'),
      apiKey: z.string().optional().describe('LINZ API key.'),
    },
    run: async (args) => {
      const apiKey = stringOrUndefined(args.apiKey);
      return searchLinzLayers(String(args.query), apiKey === undefined ? {} : { apiKey });
    },
  },
  {
    name: 'nz_nzor_names',
    title: 'Search NZOR names',
    description:
      'Searches the New Zealand Organisms Register for species names. Keyless. The NZOR host has been unreliable since 2026-09-21.',
    inputSchema: { query: z.string().describe('Name or partial name to search.') },
    run: async (args) => searchNzorNames(String(args.query)),
  },
  {
    name: 'nz_arcgis_hub_search',
    title: 'Search an ArcGIS Hub',
    description:
      'Searches datasets on an ArcGIS Hub search API. Keyless. Defaults to the Auckland Council hub; pass host for another council or agency.',
    inputSchema: {
      query: z.string().describe('Keyword search.'),
      host: z
        .string()
        .optional()
        .describe('ArcGIS Hub base URL, for example https://data.example.govt.nz.'),
    },
    run: async (args) => {
      const host = stringOrUndefined(args.host);
      return searchArcgisHubDatasets(String(args.query), host === undefined ? {} : { host });
    },
  },
  {
    name: 'nz_arcgis_hub_collections',
    title: 'List ArcGIS Hub collections',
    description:
      'Lists the collections on an ArcGIS Hub search API. Keyless. Defaults to the Auckland Council hub; pass host for another council or agency.',
    inputSchema: {
      host: z
        .string()
        .optional()
        .describe('ArcGIS Hub base URL, for example https://data.example.govt.nz.'),
    },
    run: async (args) => {
      const host = stringOrUndefined(args.host);
      return fetchArcgisHubCollections(host === undefined ? {} : { host });
    },
  },
  {
    name: 'nz_lawa_river_quality',
    title: 'LAWA river quality sites',
    description: 'River quality monitoring sites from LAWA, keyless.',
    inputSchema: {},
    run: async () => fetchLawaRiverQualitySites(),
  },
  {
    name: 'nz_mfe_layers',
    title: 'Search MfE layers',
    description: 'Searches the Ministry for the Environment Data Service layer catalogue. Keyless.',
    inputSchema: { query: z.string().describe('Keyword search.') },
    run: async (args) => searchMfeLayers(String(args.query)),
  },
  {
    name: 'nz_lris_layers',
    title: 'Search LRIS layers',
    description: 'Searches the Landcare Research LRIS layer catalogue. Keyless.',
    inputSchema: { query: z.string().describe('Keyword search.') },
    run: async (args) => searchLrisLayers(String(args.query)),
  },
  {
    name: 'nz_nzta_hotspots',
    title: 'Waka Kotahi holiday hotspots',
    description: 'Holiday journey hotspots from the Waka Kotahi journeys site. Keyless.',
    inputSchema: {},
    run: async () => fetchNztaHolidayHotspots(),
  },
  {
    name: 'nz_nzta_open_data',
    title: 'Waka Kotahi open data catalogue',
    description: 'The Waka Kotahi (NZTA) ArcGIS open data catalogue in DCAT form. Keyless.',
    inputSchema: {},
    run: async () => fetchNztaOpenDataCatalogue(),
  },
  {
    name: 'stats_nz_dataflow_catalogue',
    title: 'Stats NZ dataflow catalogue',
    description:
      'Every dataflow in the Stats NZ Aotearoa Data Explorer, with its id, name, and description. Start here before asking for data, because the data tool needs a dataflow id.',
    inputSchema: {
      subscriptionKey: z
        .string()
        .optional()
        .describe('Ocp-Apim-Subscription-Key. The keyless path works for most dataflows.'),
    },
    run: async (args) => createStatsNzClient(statsNzClientOptions(args)).getDataflowCatalogue(),
  },
  {
    name: 'stats_nz_data',
    title: 'Stats NZ data',
    description:
      'Reads observations from one Stats NZ dataflow. Use stats_nz_dataflow_catalogue to find the dataflow id, and stats_nz_codelist to turn the codes in the rows into labels.',
    inputSchema: {
      dataflowId: z.string().describe('Dataflow id, for example AGR_AGR_003.'),
      key: z
        .string()
        .optional()
        .describe('SDMX key. Defaults to all. Example: 6731.20 for one series.'),
      format: z
        .enum(STATS_NZ_FORMATS)
        .optional()
        .describe('Response format. Defaults to csv, which is the smallest.'),
      version: z.string().optional().describe('Dataflow version. Defaults to 1.0.'),
      subscriptionKey: z.string().optional().describe('Ocp-Apim-Subscription-Key.'),
    },
    run: async (args) => {
      const key = stringOrUndefined(args.key);
      const format = statsNzFormat(args.format);
      const version = stringOrUndefined(args.version);
      return createStatsNzClient(statsNzClientOptions(args)).getData({
        dataflowId: String(args.dataflowId),
        ...(key === undefined ? {} : { key }),
        ...(format === undefined ? {} : { format }),
        ...(version === undefined ? {} : { version }),
      });
    },
  },
  {
    name: 'stats_nz_codelist',
    title: 'Stats NZ codelist',
    description:
      'Reads one Stats NZ codelist, which maps the numeric codes in the data rows to their labels.',
    inputSchema: {
      codelistId: z.string().describe('Codelist id, for example CL_AGR_AGR_003.'),
      version: z.string().optional().describe('Codelist version. Defaults to 1.0.'),
      subscriptionKey: z.string().optional().describe('Ocp-Apim-Subscription-Key.'),
    },
    run: async (args) => {
      const version = stringOrUndefined(args.version);
      return createStatsNzClient(statsNzClientOptions(args)).getCodelist(
        String(args.codelistId),
        version === undefined ? {} : { version }
      );
    },
  },
];

/** Builds Stats NZ client options, leaving the subscription key out when unset. */
function statsNzClientOptions(args: Record<string, unknown>): { subscriptionKey?: string } {
  const subscriptionKey = stringOrUndefined(args.subscriptionKey);
  return subscriptionKey === undefined ? {} : { subscriptionKey };
}

/** Narrows an unknown tool argument to `string | undefined`. */
function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Narrows an unknown tool argument to one of the Stats NZ formats. */
function statsNzFormat(value: unknown): StatsNzDataFormat | undefined {
  return STATS_NZ_FORMATS.includes(value as StatsNzDataFormat)
    ? (value as StatsNzDataFormat)
    : undefined;
}

/**
 * Builds the NZ MCP server: the 14 keyless NZ sources, plus the Stats NZ ADE
 * catalogue, data, and codelist tools.
 *
 * @returns an MCP server ready to connect to a transport
 */
export function createNzOpenDataMcpServer(): McpServer {
  return createSourceMcpServer({
    serverName: NZ_MCP_SERVER_NAME,
    serverVersion: NZ_MCP_SERVER_VERSION,
    listSources: () =>
      NZ_DATA_SOURCES.map((source) => ({
        id: source.id,
        name: source.name,
        auth: source.auth,
        description: source.description,
      })),
    probeSources: async (ids) => {
      const probes = await probeAllNzDataSources(ids === undefined ? {} : { ids });
      return probes.map((probe) => ({
        id: probe.id,
        name: probe.name,
        auth: probe.auth,
        ok: probe.ok,
        status: probe.status,
        ...(probe.sample === undefined ? {} : { sample: probe.sample }),
      }));
    },
    fetchSource: async (id, options) => {
      const adapter = getNzDataSource(id);
      if (adapter === undefined) {
        throw new Error(`No NZ source with id "${id}". Call list_sources for the ids.`);
      }
      return adapter.fetchLive(options?.apiKey === undefined ? {} : { apiKey: options.apiKey });
    },
    queryTools: NZ_QUERY_TOOLS,
  });
}
