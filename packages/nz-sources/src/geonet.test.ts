import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceParseError } from './errors';
import { parseGeoNetQuakes, summarizeGeoNetQuakes } from './geonet';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/geonet-quakes-mmi3.json'), 'utf8'),
) as unknown;

describe('parseGeoNetQuakes', () => {
  it('parses the GeoNet GeoJSON fixture into quake records', () => {
    const quakes = parseGeoNetQuakes(FIXTURE);
    expect(quakes.length).toBeGreaterThan(0);
    const first = quakes[0];
    expect(first?.publicId).toMatch(/^2026p/);
    expect(first?.magnitude).toBeGreaterThan(0);
    expect(first?.locality?.length).toBeGreaterThan(0);
    expect(first?.latitude).toBeLessThan(0);
  });

  it('rejects a payload that is not a GeoJSON FeatureCollection', () => {
    expect(() => parseGeoNetQuakes({ type: 'Feature' })).toThrow(NzSourceParseError);
  });
});

describe('summarizeGeoNetQuakes', () => {
  it('counts quakes and finds the strongest and shallowest', () => {
    const quakes = parseGeoNetQuakes(FIXTURE);
    const summary = summarizeGeoNetQuakes(quakes);
    expect(summary.total).toBe(quakes.length);
    expect(summary.strongest).toBeDefined();
    expect(summary.shallowest).toBeDefined();
    expect(summary.byMagnitudeBand['3-4']).toBeGreaterThan(0);
  });
});
