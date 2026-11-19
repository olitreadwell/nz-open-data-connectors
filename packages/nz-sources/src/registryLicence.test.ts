import { describe, expect, it } from 'vitest';

import { NZ_DATA_SOURCES } from './registry.js';

const SOURCE_LICENCES = {
  'charities-register': {
    title: 'Creative Commons Attribution 3.0 New Zealand',
    url: 'https://creativecommons.org/licenses/by/3.0/nz/',
    attribution: 'Charities Register Open Data (DIA)',
  },
  'ev-roam': {
    title: 'Creative Commons Attribution 4.0 International',
    url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Waka Kotahi NZ Transport Agency',
  },
  geonet: {
    title: 'Creative Commons Attribution 3.0 New Zealand',
    url: 'https://creativecommons.org/licenses/by/3.0/nz/',
    attribution: 'GeoNet, a collaboration between NHC Toka Tū Ake and Earth Sciences New Zealand',
  },
  'geonet-felt-rapid': {
    title: 'Creative Commons Attribution 3.0 New Zealand',
    url: 'https://creativecommons.org/licenses/by/3.0/nz/',
    attribution: 'GeoNet, a collaboration between NHC Toka Tū Ake and Earth Sciences New Zealand',
  },
  nzor: {
    title: 'Creative Commons Attribution-NonCommercial-ShareAlike 3.0 New Zealand',
    url: 'https://creativecommons.org/licenses/by-nc-sa/3.0/nz/',
    attribution: 'NZOR, the New Zealand Organisms Register',
  },
} as const;

describe('adapter licence metadata', () => {
  it('records the source-wide licence for every adapter that publishes one', () => {
    for (const [id, expected] of Object.entries(SOURCE_LICENCES)) {
      const adapter = NZ_DATA_SOURCES.find((source) => source.id === id);
      expect(adapter?.licence).toEqual(expected);
      expect(adapter?.licence?.url).toMatch(/^https:\/\//);
    }
  });

  it('leaves licence metadata unset where the source supplies licence fields per record', () => {
    expect(NZ_DATA_SOURCES.find((source) => source.id === 'data-govt-nz')?.licence).toBeUndefined();
    expect(
      NZ_DATA_SOURCES.find((source) => source.id === 'nzpam-geodata')?.licence
    ).toBeUndefined();
  });
});
