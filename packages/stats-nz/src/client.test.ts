import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createStatsNzClient } from './client';
import { StatsNzApiError } from './errors';

const CATALOGUE_FIXTURE = readFileSync(
  new URL('./fixtures/dataflow-catalogue-subset.xml', import.meta.url),
  'utf8',
);

const LIVESTOCK_FIXTURE = readFileSync(
  new URL('./fixtures/agricultural-livestock-regional-council-2025-08-17.csv', import.meta.url),
  'utf8',
);

function stubFetch(handler: (url: string, init: RequestInit) => Promise<Response>): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return handler(url, init ?? {});
  };
}

describe('createStatsNzClient', () => {
  it('fetches data with the expected URL and CSV accept header', async () => {
    let capturedUrl = '';
    const fetchImpl = stubFetch(async (url) => {
      capturedUrl = url;
      return new Response('DATAFLOW,X_Y,OBS_VALUE\nSTATSNZ:A(1.0),1,5\n');
    });
    const client = createStatsNzClient({ baseUrl: 'https://stub.example/rest', fetchImpl });
    const rows = await client.getData({ dataflowId: 'X' });
    expect(capturedUrl).toBe('https://stub.example/rest/data/STATSNZ,X,1.0/all?format=csv');
    expect(rows).toHaveLength(1);
  });

  it('includes the version and key in the data URL when provided', async () => {
    let capturedUrl = '';
    const fetchImpl = stubFetch(async (url) => {
      capturedUrl = url;
      return new Response('DATAFLOW,X_Y,OBS_VALUE\n');
    });
    const client = createStatsNzClient({ baseUrl: 'https://stub.example/rest', fetchImpl });
    await client.getData({
      dataflowId: 'X',
      version: '1.0',
      key: '6731.20',
      format: 'csvfilewithlabels',
    });
    expect(capturedUrl).toBe(
      'https://stub.example/rest/data/STATSNZ,X,1.0/6731.20?format=csvfilewithlabels',
    );
  });

  it('encodes dataflow ids and keys', async () => {
    let capturedUrl = '';
    const fetchImpl = stubFetch(async (url) => {
      capturedUrl = url;
      return new Response('DATAFLOW,X_Y,OBS_VALUE\n');
    });
    const client = createStatsNzClient({ baseUrl: 'https://stub.example/rest', fetchImpl });
    await client.getData({ dataflowId: 'A B/C?d=e', key: 'x#y +z' });
    expect(capturedUrl).toBe(
      'https://stub.example/rest/data/STATSNZ,A%20B%2FC%3Fd%3De,1.0/x%23y%20%2Bz?format=csv',
    );
  });

  it('sends the subscription key header only when configured', async () => {
    const seen: string[] = [];
    const fetchImpl = stubFetch(async (_url, init) => {
      seen.push(new Headers(init.headers).get('Ocp-Apim-Subscription-Key') ?? '');
      return new Response('DATAFLOW,X_Y,OBS_VALUE\n');
    });
    const keyed = createStatsNzClient({
      baseUrl: 'https://stub.example/rest',
      fetchImpl,
      subscriptionKey: 'secret-key',
    });
    await keyed.getData({ dataflowId: 'X' });
    const keyless = createStatsNzClient({ baseUrl: 'https://stub.example/rest', fetchImpl });
    await keyless.getData({ dataflowId: 'X' });
    expect(seen).toEqual(['secret-key', '']);
  });

  it('parses the dataflow catalogue', async () => {
    const fetchImpl = stubFetch(
      async () =>
        new Response(CATALOGUE_FIXTURE, { headers: { 'content-type': 'application/xml' } }),
    );
    const client = createStatsNzClient({ baseUrl: 'https://stub.example/rest', fetchImpl });
    const flows = await client.getDataflowCatalogue();
    expect(flows.map((flow) => flow.id)).toEqual(['AGR_AGR_001', 'AGR_AGR_002', 'AGR_AGR_003']);
  });

  it('fetches a codelist with the subscription key', async () => {
    let capturedUrl = '';
    const fetchImpl = stubFetch(async (url) => {
      capturedUrl = url;
      return new Response(
        '<message:Structure><message:Structures><structure:Codelists><structure:Codelist id="CL_X" agencyID="STATSNZ" version="1.0"><structure:Code id="A"><common:Name xml:lang="en">Alpha</common:Name></structure:Code></structure:Codelist></structure:Codelists></message:Structures></message:Structure>',
      );
    });
    const client = createStatsNzClient({
      baseUrl: 'https://stub.example/rest',
      fetchImpl,
      subscriptionKey: 'secret-key',
    });
    const codelist = await client.getCodelist('CL_X', { version: '1.0' });
    expect(capturedUrl).toBe('https://stub.example/rest/codelist/STATSNZ/CL_X/1.0');
    expect(codelist.items).toEqual([{ id: 'A', name: 'Alpha' }]);
  });

  it('parses jsondata responses with a JSON accept header', async () => {
    let capturedAccept = '';
    const fetchImpl = stubFetch(async (_url, init) => {
      capturedAccept = String(new Headers(init.headers).get('Accept'));
      return new Response(
        JSON.stringify({
          data: {
            dataSets: [{ series: { '0:0': { observations: { '0': [7] } } } }],
            structure: {
              dimensions: {
                dataSet: [],
                series: [{ id: 'DIM', name: 'Dim', values: [{ id: 'd1', name: 'Dim one' }] }],
                observation: [
                  { id: 'TIME_PERIOD', name: 'Time', values: [{ id: '2024', name: '2024' }] },
                ],
              },
              attributes: { dataSet: [], series: [], observation: [] },
            },
          },
        }),
        { headers: { 'content-type': 'application/json' } },
      );
    });
    const client = createStatsNzClient({
      baseUrl: 'https://stub.example/rest',
      fetchImpl,
      subscriptionKey: 'secret-key',
    });
    const rows = await client.getData({ dataflowId: 'X', format: 'jsondata' });
    expect(capturedAccept).toBe('application/json');
    expect(rows[0]?.value).toBe(7);
  });

  it('maps API errors to StatsNzApiError with status and retryable flag', async () => {
    const fetchImpl = stubFetch(
      async () =>
        new Response(
          JSON.stringify({ message: 'Access denied due to missing subscription key.' }),
          {
            status: 401,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );
    const client = createStatsNzClient({ baseUrl: 'https://stub.example/rest', fetchImpl });
    await expect(client.getData({ dataflowId: 'X' })).rejects.toMatchObject({
      name: 'StatsNzApiError',
      status: 401,
      retryable: false,
    });
  });

  it('flags 503 and 429 responses as retryable', async () => {
    for (const status of [503, 429]) {
      const fetchImpl = stubFetch(async () => new Response('boom', { status }));
      const client = createStatsNzClient({ baseUrl: 'https://stub.example/rest', fetchImpl });
      const error = await client.getData({ dataflowId: 'X' }).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(StatsNzApiError);
      expect((error as StatsNzApiError).retryable).toBe(true);
      expect((error as StatsNzApiError).status).toBe(status);
    }
  });
});

describe('stats-nz integration against a local HTTP server', () => {
  let server: Server;
  let baseUrl: string;
  const seenRequests: string[] = [];

  beforeAll(async () => {
    server = createServer((req, res) => {
      const url = req.url ?? '';
      seenRequests.push(url);
      if (url.startsWith('/rest/data/STATSNZ,AGR_AGR_003,1.0/all') && url.includes('format=csv')) {
        res.writeHead(200, { 'content-type': 'text/csv' });
        res.end(LIVESTOCK_FIXTURE);
        return;
      }
      if (url.startsWith('/rest/data/STATSNZ,PRIVATE_TABLE,1.0/all')) {
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ message: 'Access denied due to missing subscription key.' }));
        return;
      }
      if (url.startsWith('/rest/dataflow/STATSNZ/all')) {
        res.writeHead(200, { 'content-type': 'application/xml' });
        res.end(CATALOGUE_FIXTURE);
        return;
      }
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/rest`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it('fetches and parses a full real data table end to end', async () => {
    const client = createStatsNzClient({ baseUrl });
    const rows = await client.getData({ dataflowId: 'AGR_AGR_003', format: 'csv' });
    expect(rows.length).toBeGreaterThan(19000);
    expect(seenRequests).toContain('/rest/data/STATSNZ,AGR_AGR_003,1.0/all?format=csv');
  });

  it('fetches the catalogue end to end', async () => {
    const client = createStatsNzClient({ baseUrl });
    const flows = await client.getDataflowCatalogue();
    expect(flows).toHaveLength(3);
  });

  it('surfaces a 401 from the real HTTP stack as a typed error', async () => {
    const client = createStatsNzClient({ baseUrl });
    const error = await client
      .getData({ dataflowId: 'PRIVATE_TABLE' })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(StatsNzApiError);
    expect((error as StatsNzApiError).status).toBe(401);
    expect((error as StatsNzApiError).message).toContain('subscription key');
  });
});
