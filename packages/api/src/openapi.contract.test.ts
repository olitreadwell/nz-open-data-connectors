import { describe, expect, it } from 'vitest';
import type { NzSourceLicense } from '@nz-open-data-connectors/nz-sources';

import { createConnectorsApp } from './index';
import { OPEN_API_DOCUMENT } from './openapi';

type DocumentedPath = keyof typeof OPEN_API_DOCUMENT.paths;

interface SourceResponse {
  id: string;
  name: string;
  auth: string;
  description: string;
  license?: NzSourceLicense;
}

const EXPECTED_SOURCE_LICENSES: Record<string, NzSourceLicense> = {
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
};

/**
 * Checks one licence value against the documented NzSourceLicense schema.
 *
 * @param value - The response value to check.
 * @param label - The field path used in assertion messages.
 */
function expectSourceLicense(value: unknown, label: string): asserts value is NzSourceLicense {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const license = value as Record<string, unknown>;
  expect(Object.keys(license).sort(), label).toEqual(['attribution', 'title', 'url']);
  for (const field of ['title', 'url', 'attribution'] as const) {
    expect(typeof license[field], `${label}.${field}`).toBe('string');
    if (typeof license[field] !== 'string') return;
    expect(license[field].length, `${label}.${field}`).toBeGreaterThan(0);
    expect(license[field], `${label}.${field}`).toBe(license[field].trim());
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(String(license.url));
  } catch {
    throw new Error(`${label}.url must be an absolute URL`);
  }
  expect(['http:', 'https:'], `${label}.url`).toContain(parsedUrl.protocol);
}

/**
 * Checks one source value against the documented NzSource schema.
 *
 * @param value - The response value to check.
 * @param label - The field path used in assertion messages.
 */
function expectSource(value: unknown, label: string): asserts value is SourceResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const source = value as Record<string, unknown>;
  const expectedKeys =
    source.license === undefined
      ? ['auth', 'description', 'id', 'name']
      : ['auth', 'description', 'id', 'license', 'name'];
  expect(Object.keys(source).sort(), label).toEqual(expectedKeys);
  for (const field of ['id', 'name', 'description'] as const) {
    expect(typeof source[field], `${label}.${field}`).toBe('string');
    if (typeof source[field] !== 'string') return;
    expect(source[field].length, `${label}.${field}`).toBeGreaterThan(0);
  }
  expect(['none', 'key', 'account'], `${label}.auth`).toContain(source.auth);
  if (source.license !== undefined) {
    expectSourceLicense(source.license, `${label}.license`);
  }
}

/**
 * Returns the app's route paths, excluding middleware-only registrations.
 *
 * @param app - The built connectors app.
 * @returns Sorted route paths with ":id" params converted to "{id}".
 */
function registeredPaths(app: ReturnType<typeof createConnectorsApp>): string[] {
  return [...new Set(app.routes.map((route) => route.path))]
    .filter((path) => path !== '/api/*' && path !== '/*')
    .map((path) => path.replaceAll(':id', '{id}'))
    .sort();
}

/**
 * Returns the documented responses for one path.
 *
 * @param path - A path key from the OpenAPI document.
 * @returns The documented HTTP responses for that path.
 */
function documentedResponses(path: DocumentedPath): Record<string, unknown> {
  return OPEN_API_DOCUMENT.paths[path].get.responses;
}

describe('OpenAPI contract', () => {
  it('registers every app route in the OpenAPI document', () => {
    const app = createConnectorsApp({});
    const documented = new Set(Object.keys(OPEN_API_DOCUMENT.paths));

    for (const path of registeredPaths(app)) {
      expect(documented.has(path), `missing documented path ${path}`).toBe(true);
    }
  });

  it('registers every documented path in the app', () => {
    const app = createConnectorsApp({});
    const registered = new Set(registeredPaths(app));

    for (const path of Object.keys(OPEN_API_DOCUMENT.paths)) {
      expect(registered.has(path), `missing registered route ${path}`).toBe(true);
    }
  });

  it('documents the rate limit response on every /api path', () => {
    const apiPaths = (Object.keys(OPEN_API_DOCUMENT.paths) as DocumentedPath[]).filter((path) =>
      path.startsWith('/api/')
    );

    for (const path of apiPaths) {
      expect(Object.keys(documentedResponses(path)), `missing 429 response for ${path}`).toContain(
        '429'
      );
    }
  });

  it('documents error responses for routes that can fail', () => {
    expect(Object.keys(documentedResponses('/api/sources/{id}/probe'))).toEqual(
      expect.arrayContaining(['200', '400', '404', '429'])
    );
    expect(Object.keys(documentedResponses('/api/stats-nz/data'))).toEqual(
      expect.arrayContaining(['200', '400', '429'])
    );
    expect(Object.keys(documentedResponses('/api/stats-nz/codelist'))).toEqual(
      expect.arrayContaining(['200', '400', '401', '429'])
    );
  });

  it('documents source-level licence metadata in the source list response', () => {
    const sources = OPEN_API_DOCUMENT.paths['/api/sources'].get.responses['200'];
    expect(sources.description).toContain('license');
    expect(sources.content['application/json'].schema.items.$ref).toBe(
      '#/components/schemas/NzSource'
    );

    const license = OPEN_API_DOCUMENT.components.schemas.NzSourceLicense;
    expect(license.required).toEqual(['title', 'url', 'attribution']);
    expect(license.properties.title.minLength).toBe(1);
    expect(license.properties.url.format).toBe('uri');
    expect(license.properties.attribution.minLength).toBe(1);
  });

  it('serves every source and licence in the documented shape', async () => {
    const app = createConnectorsApp({});
    const res = await app.request('/api/sources');
    expect(res.status).toBe(200);

    const payload: unknown = await res.json();
    expect(Array.isArray(payload)).toBe(true);
    if (!Array.isArray(payload)) return;

    const items: unknown[] = payload;
    const sources: SourceResponse[] = [];
    for (const [index, item] of items.entries()) {
      expectSource(item, `sources[${index}]`);
      sources.push(item);
    }

    const byId = new Map(sources.map((source) => [source.id, source]));
    for (const [id, expectedLicense] of Object.entries(EXPECTED_SOURCE_LICENSES)) {
      expect(byId.get(id)?.license, id).toEqual(expectedLicense);
    }
    expect(
      sources
        .filter((source) => source.license !== undefined)
        .map((source) => source.id)
        .sort()
    ).toEqual(Object.keys(EXPECTED_SOURCE_LICENSES).sort());
  });
});
