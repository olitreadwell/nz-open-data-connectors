import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
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
  it('advertises the country query tool', async () => {
    const client = await connectClient(createNzOpenDataMcpServer());

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name)).toContain('nz_felt_earthquakes');
  });

  it('lists every source in the country registry', async () => {
    const client = await connectClient(createNzOpenDataMcpServer());

    const result = await client.callTool({ name: 'list_sources', arguments: {} });

    const sources = JSON.parse(firstText(result)) as { id: string }[];
    expect(sources.length).toBe(14);
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
  stats_nz_data: { dataflowId: 'NOT_A_DATAFLOW' },
  stats_nz_codelist: { codelistId: 'NOT_A_CODELIST' },
};

/** Every tool called with every optional argument filled in. */
const FULL_ARGS: Record<string, Record<string, unknown>> = {
  probe_sources: { ids: ['geonet'] },
  fetch_source: { id: 'geonet', apiKey: 'k' },
  nz_felt_earthquakes: { minMmi: 4 },
  nz_datastore_rows: { resourceId: 'not-a-real-resource', limit: 10 },
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
        expect((result as { content?: unknown }).content, tool.name).toBeDefined();
      }
    }

    vi.unstubAllGlobals();
  }, 60_000);
});
