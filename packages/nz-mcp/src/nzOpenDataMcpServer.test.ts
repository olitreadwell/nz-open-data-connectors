import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import { createNzOpenDataMcpServer } from './nzOpenDataMcpServer.js';

/** Connects a client to a server over the in-memory transport pair. */
async function connectClient(
  server: ReturnType<typeof createNzOpenDataMcpServer>
): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

/** Reads the first text block out of a tool result. */
function firstText(result: unknown): string {
  const content = (result as { content: { type: string; text?: string }[] }).content;
  return content.find((entry) => entry.type === 'text')?.text ?? '';
}

describe('createNzOpenDataMcpServer', () => {
  it('reports the package.json version in the handshake', async () => {
    const manifest = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    ) as { version: string };
    const client = await connectClient(createNzOpenDataMcpServer());
    expect(client.getServerVersion()?.version).toBe(manifest.version);
  });

  it('advertises the country query tool', async () => {
    const client = await connectClient(createNzOpenDataMcpServer());

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name)).toContain('nz_felt_earthquakes');
  });

  it('advertises a named tool for every library query', async () => {
    const client = await connectClient(createNzOpenDataMcpServer());

    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);

    expect(names).toEqual([
      'list_sources',
      'probe_sources',
      'fetch_source',
      'nz_felt_earthquakes',
      'nz_datastore_rows',
      'nz_trademe_categories',
      'nz_ade_search',
      'nz_data_govt_search',
      'nz_digitalnz_records',
      'nz_digitalnz_media',
      'nz_linz_layers',
      'nz_nzor_names',
      'nz_arcgis_hub_search',
      'nz_arcgis_hub_collections',
      'nz_lawa_river_quality',
      'nz_mfe_layers',
      'nz_lris_layers',
      'nz_nzta_hotspots',
      'nz_nzta_open_data',
      'stats_nz_dataflow_catalogue',
      'stats_nz_data',
      'stats_nz_codelist',
    ]);
  });

  it('rejects an unknown source id', async () => {
    const client = await connectClient(createNzOpenDataMcpServer());

    const result = await client.callTool({
      name: 'probe_sources',
      arguments: { ids: ['not-a-source'] },
    });

    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(firstText(result)).toContain('not-a-source');
  });

  it('lists every source in the country registry', async () => {
    const client = await connectClient(createNzOpenDataMcpServer());

    const result = await client.callTool({ name: 'list_sources', arguments: {} });

    const sources = JSON.parse(firstText(result)) as { id: string }[];
    expect(sources.length).toBe(15);
    expect(sources.every((source) => source.id.length > 0)).toBe(true);
  });

  it('names a source that is not in the registry', async () => {
    const client = await connectClient(createNzOpenDataMcpServer());

    const result = await client.callTool({
      name: 'fetch_source',
      arguments: { id: 'not-a-real-source' },
    });

    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(firstText(result)).toContain('not-a-real-source');
  });
});

/** Arguments a tool needs before its handler will run at all. */
const REQUIRED_ARGS: Record<string, Record<string, unknown>> = {
  nz_datastore_rows: { resourceId: 'not-a-real-resource' },
  nz_ade_search: { query: 'earnings' },
  nz_data_govt_search: { query: 'sheep' },
  nz_digitalnz_records: { query: 'kiwi' },
  nz_digitalnz_media: { query: 'kiwi', mediaType: 'newspapers' },
  nz_linz_layers: { query: 'parcel' },
  nz_nzor_names: { query: 'kiwi' },
  nz_arcgis_hub_search: { query: 'water' },
  nz_mfe_layers: { query: 'water' },
  nz_lris_layers: { query: 'soil' },
  stats_nz_data: { dataflowId: 'NOT_A_DATAFLOW' },
  stats_nz_codelist: { codelistId: 'NOT_A_CODELIST' },
};

/** Every tool called with every optional argument filled in. */
const FULL_ARGS: Record<string, Record<string, unknown>> = {
  probe_sources: { ids: ['geonet'] },
  fetch_source: { id: 'geonet', apiKey: 'k' },
  nz_felt_earthquakes: { minMmi: 4 },
  nz_datastore_rows: { resourceId: 'not-a-real-resource', limit: 10 },
  nz_ade_search: { query: 'earnings', limit: 5 },
  nz_data_govt_search: { query: 'sheep' },
  nz_digitalnz_records: { query: 'kiwi', apiKey: 'k' },
  nz_digitalnz_media: { query: 'kiwi', mediaType: 'images', apiKey: 'k' },
  nz_linz_layers: { query: 'parcel', apiKey: 'k' },
  nz_nzor_names: { query: 'kiwi' },
  nz_arcgis_hub_search: { query: 'water', host: 'https://data.example.org' },
  nz_mfe_layers: { query: 'water' },
  nz_lris_layers: { query: 'soil' },
  stats_nz_dataflow_catalogue: { subscriptionKey: 'k' },
  stats_nz_data: {
    dataflowId: 'NOT_A_DATAFLOW',
    key: '1.2',
    format: 'csv',
    version: '1.0',
    subscriptionKey: 'k',
  },
  stats_nz_codelist: { codelistId: 'NOT_A_CODELIST', version: '1.0', subscriptionKey: 'k' },
};

describe('every advertised tool', () => {
  it('fails cleanly when the upstream API answers with a 500, with and without arguments', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 500 })));
    const client = await connectClient(createNzOpenDataMcpServer());

    const { tools } = await client.listTools();

    for (const tool of tools) {
      const argumentSets = [REQUIRED_ARGS[tool.name] ?? {}, FULL_ARGS[tool.name] ?? {}];
      for (const args of argumentSets) {
        const result = await client.callTool({ name: tool.name, arguments: args });
        const isError = (result as { isError?: boolean }).isError === true;
        expect((result as { content?: unknown }).content, tool.name).toBeDefined();
        if (tool.name === 'list_sources') {
          expect(isError, tool.name).toBe(false);
        } else if (tool.name === 'probe_sources') {
          expect(isError, tool.name).toBe(false);
          const probes = JSON.parse(firstText(result)) as { ok: boolean }[];
          expect(probes.length, tool.name).toBeGreaterThan(0);
          expect(
            probes.every((probe) => !probe.ok),
            tool.name
          ).toBe(true);
        } else {
          expect(isError, tool.name).toBe(true);
        }
      }
    }

    vi.unstubAllGlobals();
  }, 60_000);
});
