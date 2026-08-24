import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseDataGovtNzDatasets } from './dataGovtNz';
import { NzSourceParseError } from './errors';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/data-govt-nz-search-sheep.json'), 'utf8'),
) as unknown;

describe('parseDataGovtNzDatasets', () => {
  it('parses the data.govt.nz CKAN fixture into datasets', () => {
    const result = parseDataGovtNzDatasets(FIXTURE);
    expect(result.count).toBe(31);
    expect(result.datasets.length).toBeGreaterThan(0);
    const first = result.datasets[0];
    expect(first?.title?.length).toBeGreaterThan(0);
    expect(first?.name?.length).toBeGreaterThan(0);
  });

  it('rejects a failed CKAN response', () => {
    expect(() => parseDataGovtNzDatasets({ success: false })).toThrow(NzSourceParseError);
  });
});
