import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceParseError } from './errors';
import { parseLinzLayers } from './linz';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/linz-layer-search.json'), 'utf8'),
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
