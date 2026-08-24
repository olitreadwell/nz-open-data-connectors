import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceParseError } from './errors';
import { parseTradeMeCategories } from './tradeMe';

const FIXTURE = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src/fixtures/trademe-categories.json'), 'utf8'),
) as unknown;

describe('parseTradeMeCategories', () => {
  it('parses the Trade Me fixture into a category tree', () => {
    const root = parseTradeMeCategories(FIXTURE);
    expect(root.name).toBe('Root');
    expect(root.subcategories.length).toBeGreaterThan(0);
    expect(root.subcategories[0]?.path).toMatch(/^\/Trade-Me-Motors/);
  });

  it('rejects a payload without categories', () => {
    expect(() => parseTradeMeCategories({ Name: 'Root' })).toThrow(NzSourceParseError);
  });
});
