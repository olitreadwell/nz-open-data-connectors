import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceParseError } from './errors';
import { parseNzorNames } from './nzor';

const FIXTURE = readFileSync(path.join(process.cwd(), 'src/fixtures/nzor-names-kiwi.xml'), 'utf8');

describe('parseNzorNames', () => {
  it('parses the NZOR fixture into a search result', () => {
    const result = parseNzorNames(FIXTURE);
    expect(result.total).toBeGreaterThan(0);
    expect(result.names.length).toBeGreaterThan(0);
    expect(result.names[0]?.fullName?.length).toBeGreaterThan(0);
  });

  it('returns an empty result for an empty payload', () => {
    expect(() => parseNzorNames('not xml')).toThrow(NzSourceParseError);
  });

  it('throws when Total is not a finite number', () => {
    expect(() =>
      parseNzorNames('<Response><Total>not-a-number</Total><Names/></Response>'),
    ).toThrow(NzSourceParseError);
  });

  it('returns an empty names list when Names is absent', () => {
    const result = parseNzorNames('<Response><Total>170151</Total></Response>');
    expect(result).toEqual({ total: 170151, names: [] });
  });

  it('throws when Names is present but not an object or array', () => {
    expect(() =>
      parseNzorNames('<Response><Total>170151</Total><Names>broken</Names></Response>'),
    ).toThrow(NzSourceParseError);
  });
});
