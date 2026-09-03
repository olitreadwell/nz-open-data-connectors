import { describe, expect, it } from 'vitest';

import { probeNzDataSource, searchDigitalNzMedia } from '@nzlab/nz-sources';
import type { DigitalNzRecord } from '@nzlab/nz-sources';
import type { StatsNzClient } from '@nzlab/stats-nz';

import { runCli } from './commands.js';
import type { CliOutput } from './commands.js';

function createCapture(): { out: string[]; err: string[]; output: CliOutput } {
  const out: string[] = [];
  const err: string[] = [];
  const output: CliOutput = {
    writeOut: (line) => out.push(line),
    writeErr: (line) => err.push(line),
  };
  return { out, err, output };
}

const stubProbe: typeof probeNzDataSource = async (adapter) => ({
  id: adapter.id,
  name: adapter.name,
  auth: adapter.auth,
  ok: true,
  status: 'ok',
});

const stubSearchMedia: typeof searchDigitalNzMedia = async (query, mediaType) => {
  const record: DigitalNzRecord = {
    id: 1,
    title: `A ${mediaType} result for ${query}`,
    description: 'stub',
    contentPartner: 'stub',
    collection: 'stub',
    url: 'https://example.com/record',
    categories: [mediaType],
    thumbnailUrl: 'https://example.com/thumb.jpg',
    largeThumbnailUrl: 'https://example.com/large.jpg',
    objectUrl: '',
    sourceUrl: '',
    displayDate: '',
  };
  return [record];
};

function createStubStatsNzClient(): StatsNzClient {
  return {
    getDataflowCatalogue: async () => [
      {
        id: 'AGR_AGR_003',
        agencyId: 'STATSNZ',
        version: '1.0',
        title: 'Agricultural production',
      },
    ],
    getData: async (_request) => [
      { dimensions: { YEAR: '2024', AREA: 'Auckland' }, value: 10 },
      { dimensions: { YEAR: '2024', AREA: 'Wellington' }, value: 20 },
    ],
    getCodelist: async (id) => ({
      id,
      agencyId: 'STATSNZ',
      version: '1.0',
      items: [{ id: '2024', name: 'Year ended June 2024' }],
    }),
  };
}

function createDeps(): {
  probeSource: typeof stubProbe;
  searchMedia: typeof stubSearchMedia;
  statsNzClient: StatsNzClient;
} {
  return {
    probeSource: stubProbe,
    searchMedia: stubSearchMedia,
    statsNzClient: createStubStatsNzClient(),
  };
}

describe('runCli', () => {
  it('prints help when no command is given', async () => {
    const { out, err, output } = createCapture();
    const exitCode = await runCli([], output, createDeps());
    expect(exitCode).toBe(0);
    expect(out.join('\n')).toContain('nzdata - NZ open data connectors');
    expect(err).toEqual([]);
  });

  it('prints help for the help command', async () => {
    const { out, output } = createCapture();
    const exitCode = await runCli(['help'], output, createDeps());
    expect(exitCode).toBe(0);
    expect(out.join('\n')).toContain('Usage:');
  });

  it('lists every source as JSON', async () => {
    const { out, output } = createCapture();
    const exitCode = await runCli(['sources'], output, createDeps());
    expect(exitCode).toBe(0);
    const sources = JSON.parse(out.join('\n')) as Array<{ id: string }>;
    expect(sources.length).toBeGreaterThanOrEqual(8);
  });

  it('probes a known source', async () => {
    const { out, output } = createCapture();
    const exitCode = await runCli(['probe', 'linz'], output, createDeps());
    expect(exitCode).toBe(0);
    const probe = JSON.parse(out.join('\n')) as { id: string; ok: boolean };
    expect(probe.id).toBe('linz');
    expect(probe.ok).toBe(true);
  });

  it('errors on an unknown source', async () => {
    const { err, output } = createCapture();
    const exitCode = await runCli(['probe', 'nope'], output, createDeps());
    expect(exitCode).toBe(1);
    expect(err.join('\n')).toContain('Unknown source: nope');
  });

  it('searches media as JSON with images by default', async () => {
    const { out, output } = createCapture();
    const exitCode = await runCli(['media', '--query', 'kiwi'], output, createDeps());
    expect(exitCode).toBe(0);
    const result = JSON.parse(out.join('\n')) as {
      query: string;
      mediaType: string;
      records: Array<{ thumbnailUrl: string }>;
    };
    expect(result.query).toBe('kiwi');
    expect(result.mediaType).toBe('images');
    expect(result.records[0]?.thumbnailUrl).toContain('example.com');
  });

  it('searches media with an explicit type', async () => {
    const { out, output } = createCapture();
    const exitCode = await runCli(
      ['media', '--query', 'kiwi', '--type', 'newspapers'],
      output,
      createDeps()
    );
    expect(exitCode).toBe(0);
    const result = JSON.parse(out.join('\n')) as { mediaType: string };
    expect(result.mediaType).toBe('newspapers');
  });

  it('errors when the media query is missing', async () => {
    const { err, output } = createCapture();
    const exitCode = await runCli(['media'], output, createDeps());
    expect(exitCode).toBe(1);
    expect(err.join('\n')).toContain('--query');
  });

  it('errors on an unknown media type', async () => {
    const { err, output } = createCapture();
    const exitCode = await runCli(
      ['media', '--query', 'kiwi', '--type', 'paintings'],
      output,
      createDeps()
    );
    expect(exitCode).toBe(1);
    expect(err.join('\n')).toContain('Unknown media type: paintings');
  });

  it('prints the catalogue as JSON', async () => {
    const { out, output } = createCapture();
    const exitCode = await runCli(['catalogue'], output, createDeps());
    expect(exitCode).toBe(0);
    const dataflows = JSON.parse(out.join('\n')) as Array<{ id: string }>;
    expect(dataflows[0]?.id).toBe('AGR_AGR_003');
  });

  it('prints data rows as JSON by default', async () => {
    const { out, output } = createCapture();
    const exitCode = await runCli(['data', '--dataflow', 'AGR_AGR_003'], output, createDeps());
    expect(exitCode).toBe(0);
    const rows = JSON.parse(out.join('\n')) as Array<{ value: number }>;
    expect(rows).toHaveLength(2);
  });

  it('prints data rows as CSV with --format csv', async () => {
    const { out, output } = createCapture();
    const exitCode = await runCli(
      ['data', '--dataflow', 'AGR_AGR_003', '--format', 'csv'],
      output,
      createDeps()
    );
    expect(exitCode).toBe(0);
    expect(out.join('\n')).toContain('AREA,YEAR,value');
  });

  it('errors when dataflow is missing', async () => {
    const { err, output } = createCapture();
    const exitCode = await runCli(['data'], output, createDeps());
    expect(exitCode).toBe(1);
    expect(err.join('\n')).toContain('--dataflow');
  });

  it('errors on an unknown format', async () => {
    const { err, output } = createCapture();
    const exitCode = await runCli(
      ['data', '--dataflow', 'AGR_AGR_003', '--format', 'xml'],
      output,
      createDeps()
    );
    expect(exitCode).toBe(1);
    expect(err.join('\n')).toContain('Unknown format: xml');
  });

  it('prints a codelist as JSON', async () => {
    const { out, output } = createCapture();
    const exitCode = await runCli(['codelist', '--codelist', 'CL_YEAR'], output, createDeps());
    expect(exitCode).toBe(0);
    const codelist = JSON.parse(out.join('\n')) as { id: string };
    expect(codelist.id).toBe('CL_YEAR');
  });

  it('errors on an unknown command', async () => {
    const { err, output } = createCapture();
    const exitCode = await runCli(['frobnicate'], output, createDeps());
    expect(exitCode).toBe(1);
    expect(err.join('\n')).toContain('Unknown command: frobnicate');
  });

  it('errors on an unknown option', async () => {
    const { err, output } = createCapture();
    const exitCode = await runCli(['sources', '--bogus'], output, createDeps());
    expect(exitCode).toBe(1);
    expect(err.join('\n')).toContain('bogus');
  });
});
