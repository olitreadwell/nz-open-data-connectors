import { describe, expect, it } from 'vitest';

import { createSourceLicense } from './index.js';

const VALID_LICENSE = {
  title: 'Creative Commons Attribution 3.0 New Zealand',
  url: 'https://creativecommons.org/licenses/by/3.0/nz/',
  attribution: 'GeoNet',
};

describe('createSourceLicense', () => {
  it('freezes the licence so nested fields cannot be changed', () => {
    const license = createSourceLicense(VALID_LICENSE);

    expect(Object.isFrozen(license)).toBe(true);
    expect(() => {
      (license as { title: string }).title = 'changed';
    }).toThrow(TypeError);
  });

  it.each(['title', 'url', 'attribution'] as const)('rejects an empty %s', (field) => {
    expect(() => createSourceLicense({ ...VALID_LICENSE, [field]: '  ' })).toThrow(
      `Source license ${field} must be a non-empty string`
    );
  });

  it.each(['not-a-url', '/relative', 'ftp://example.com/licence'])(
    'rejects a URL that is not absolute HTTP(S): %s',
    (url) => {
      expect(() => createSourceLicense({ ...VALID_LICENSE, url })).toThrow(
        'Source license url must be an absolute HTTP(S) URL'
      );
    }
  );

  it('trims padded licence fields before returning them', () => {
    const license = createSourceLicense({
      title: '  Creative Commons Attribution 3.0 New Zealand  ',
      url: '  https://creativecommons.org/licenses/by/3.0/nz/  ',
      attribution: '  GeoNet  ',
    });

    expect(license).toEqual(VALID_LICENSE);
  });
});
