import { describe, expect, it } from 'vitest';

import { parseDcatCatalogue } from './dcatCatalogue.js';

const CATALOGUE_WITH_NUMERIC_TITLE = {
  '@type': 'dcat:Catalog',
  dataset: [
    {
      '@type': 'dcat:Dataset',
      identifier: 'https://example.test/dataset/1',
      title: 5000,
      distribution: [],
    },
  ],
};

describe('parseDcatCatalogue', () => {
  it('normalizes a numeric title that ArcGIS Hub emits', () => {
    const catalogue = parseDcatCatalogue(CATALOGUE_WITH_NUMERIC_TITLE, 'Example DCAT');
    expect(catalogue.datasets[0]?.title).toBe('5000');
  });
});
