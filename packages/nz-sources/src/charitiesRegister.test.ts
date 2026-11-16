import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { NzSourceApiError, NzSourceParseError } from './errors.js';
import {
  CHARITIES_REGISTER_SOURCE_ID,
  charitiesRegisterAdapter,
  parseCharitiesRegister,
  searchCharitiesRegister,
} from './charitiesRegister.js';

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(process.cwd(), 'src/fixtures/charities-register-red-cross-2026-11-16.json'),
    'utf8'
  )
) as unknown;

const stubFetch = (async () =>
  new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;

describe('parseCharitiesRegister', () => {
  it('parses the inline-count response shape', () => {
    const result = parseCharitiesRegister(FIXTURE);
    expect(result.count).toBe(3);
    expect(result.organisations).toHaveLength(3);
    expect(result.organisations[0]).toMatchObject({
      organisationId: 39075,
      name: 'New Zealand Red Cross Foundation',
      registrationNumber: 'CC22820',
      status: 'Registered',
      city: 'Wellington',
    });
  });

  it('keeps a deregistered organisation and its dates', () => {
    const result = parseCharitiesRegister(FIXTURE);
    const stratford = result.organisations.find(
      (organisation) => organisation.name === 'Stratford Red Cross'
    );
    expect(stratford?.status).toBe('Deregistered');
    expect(stratford?.registrationDate).toBe('2008-06-30T00:00:00Z');
  });

  it('parses the plain list response shape', () => {
    const listShape = {
      d: [
        {
          OrganisationId: 1,
          Name: 'Example Charity',
          CharityRegistrationNumber: null,
          RegistrationStatus: 'Registered',
        },
      ],
    };
    const result = parseCharitiesRegister(listShape);
    expect(result.count).toBe(1);
    expect(result.organisations[0]?.name).toBe('Example Charity');
  });

  it('rejects a response without the OData d envelope', () => {
    expect(() => parseCharitiesRegister({ results: [] })).toThrow(NzSourceParseError);
  });
});

describe('searchCharitiesRegister', () => {
  it('fetches and parses the Charities Register response', async () => {
    const result = await searchCharitiesRegister('red cross', stubFetch);
    expect(result.organisations).toHaveLength(3);
  });

  it('sends an OData name filter and inline count', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await searchCharitiesRegister('red cross', fetchImpl);
    const url = new URL(requestedUrl);
    expect(url.hostname).toBe('www.odata.charities.govt.nz');
    expect(url.searchParams.get('$filter')).toBe("substringof('red cross',Name)");
    expect(url.searchParams.get('$inlinecount')).toBe('allpages');
  });

  it('escapes a single quote in the search term', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: string | URL | Request) => {
      requestedUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return new Response(JSON.stringify(FIXTURE), { status: 200 });
    }) as typeof fetch;
    await searchCharitiesRegister("kids' club", fetchImpl);
    expect(new URL(requestedUrl).searchParams.get('$filter')).toBe(
      "substringof('kids'' club',Name)"
    );
  });

  it('throws an API error on a non-ok response', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 503 })) as typeof fetch;
    await expect(searchCharitiesRegister('red cross', fetchImpl)).rejects.toThrow(NzSourceApiError);
  });
});

describe('charitiesRegisterAdapter', () => {
  it('registers the kebab-case id and keyless auth', () => {
    expect(charitiesRegisterAdapter.id).toBe(CHARITIES_REGISTER_SOURCE_ID);
    expect(charitiesRegisterAdapter.auth).toBe('none');
  });

  it('loads the committed fixture', () => {
    expect(charitiesRegisterAdapter.loadFixture().count).toBe(3);
  });

  it('fetches through fetchLive with a stubbed fetch', async () => {
    await expect(
      charitiesRegisterAdapter.fetchLive({ fetchImpl: stubFetch })
    ).resolves.toMatchObject({ count: 3 });
  });
});
