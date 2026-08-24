import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseDigitalNzRecords } from './digitalNz';
import { NzSourceParseError } from './errors';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/digitalnz-search-sheep.json'), 'utf8'),
) as unknown;

describe('parseDigitalNzRecords', () => {
  it('parses the DigitalNZ fixture into records', () => {
    const records = parseDigitalNzRecords(FIXTURE);
    expect(records.length).toBeGreaterThan(0);
    const first = records[0];
    expect(first?.title?.length).toBeGreaterThan(0);
    expect(first?.id).toBeGreaterThan(0);
  });

  it('rejects a payload without a search result', () => {
    expect(() => parseDigitalNzRecords({ search: {} })).toThrow(NzSourceParseError);
  });
});
