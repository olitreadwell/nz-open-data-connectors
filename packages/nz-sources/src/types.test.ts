import { describe, expect, it } from 'vitest';

import { createSourceLicense } from './types.js';

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
});
