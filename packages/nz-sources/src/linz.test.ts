import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceParseError } from './errors.js';
import { linzAdapter, parseLinzLayers, searchLinzLayers } from './linz.js';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/linz-layer-search.json'), 'utf8')
) as unknown;

describe('parseLinzLayers', () => {
  it('parses the LINZ layer search fixture into layers', () => {
    const layers = parseLinzLayers(FIXTURE);
    expect(layers.length).toBeGreaterThan(0);
    const propertyTitles = layers.find((layer) => layer.title === 'NZ Property Titles');
    expect(propertyTitles?.id).toBe(50804);
    expect(propertyTitles?.url).toContain('50804');
  });

  it('rejects a payload that is not a layer search response', () => {
    expect(() => parseLinzLayers({ type: 'FeatureCollection' })).toThrow(NzSourceParseError);
  });
});

describe('LINZ key handling', () => {
  /** Runs one search and returns the x-api-key header the request carried. */
  async function capturedApiKeyHeader(apiKey: string | undefined): Promise<string | null> {
    let seen: string | null = null;
    await searchLinzLayers('property', {
      ...(apiKey === undefined ? {} : { apiKey }),
      fetchImpl: async (_input, init) => {
        seen = new Headers(init?.headers).get('x-api-key');
        return new Response(JSON.stringify(FIXTURE), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    return seen;
  }

  it('sends the key when one is configured', async () => {
    await expect(capturedApiKeyHeader('secret-key')).resolves.toBe('secret-key');
  });

  it('does not send the header when the key is set but empty', async () => {
    await expect(capturedApiKeyHeader('')).resolves.toBeNull();
  });

  it('forwards a key given to the adapter', async () => {
    let seen: string | null = null;
    await linzAdapter.fetchLive({
      apiKey: 'adapter-key',
      fetchImpl: async (_input, init) => {
        seen = new Headers(init?.headers).get('x-api-key');
        return new Response(JSON.stringify(FIXTURE), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    expect(seen).toBe('adapter-key');
  });
});
