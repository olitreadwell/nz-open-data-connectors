import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseAdeSearchResults } from './adeSearch.js';
import { NzSourceParseError } from './errors.js';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/ade-search-earnings.json'), 'utf8')
) as unknown;

describe('parseAdeSearchResults', () => {
  it('parses the ADE search fixture into dataflow records', () => {
    const result = parseAdeSearchResults(FIXTURE);
    expect(result.numFound).toBeGreaterThan(0);
    expect(result.dataflows.length).toBeGreaterThan(0);
    const first = result.dataflows[0];
    expect(first?.dataflowId).toBe('LEED_AP1_002');
    expect(first?.name).toContain('Median annual earnings');
    expect(first?.version).toBe('1.0');
    expect(first?.dimensions.length).toBeGreaterThan(0);
  });

  it('rejects a payload that is not an ADE search response', () => {
    expect(() => parseAdeSearchResults({ results: [] })).toThrow(NzSourceParseError);
  });
});
