import { z } from 'zod';

import { NzSourceParseError } from './errors.js';
import { readFixtureJson } from './fixtures.js';
import { httpGet } from './http.js';
import type { NzDataAdapter } from './types.js';

/** Registry id for the Charities Register Open Data adapter. */
export const CHARITIES_REGISTER_SOURCE_ID = 'charities-register';

/** One organisation on the Charities Register. */
export interface CharityOrganisation {
  organisationId: number;
  name: string;
  registrationNumber: string;
  status: string;
  registrationDate: string | null;
  deregistrationDate: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  nzbn: string | null;
  charitablePurpose: string | null;
  lastModified: string | null;
}

/** A name search result from the Charities Register OData API. */
export interface CharitiesSearchResult {
  count: number;
  organisations: CharityOrganisation[];
}

const NULLABLE_STRING = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const CHARITY_ORGANISATION_SCHEMA = z
  .object({
    OrganisationId: z.number(),
    Name: z.string(),
    CharityRegistrationNumber: NULLABLE_STRING,
    RegistrationStatus: NULLABLE_STRING,
    DateRegistered: NULLABLE_STRING,
    DeregistrationDate: NULLABLE_STRING,
    WebSiteURL: NULLABLE_STRING,
    EMailAddress1: NULLABLE_STRING,
    Telephone1: NULLABLE_STRING,
    PostalAddressCity: NULLABLE_STRING,
    NZBNNumber: NULLABLE_STRING,
    CharitablePurpose: NULLABLE_STRING,
    ModifiedOn: NULLABLE_STRING,
  })
  .loose();

const CHARITIES_RESPONSE_SCHEMA = z.object({
  d: z.union([
    z.array(CHARITY_ORGANISATION_SCHEMA),
    z.object({
      results: z.array(CHARITY_ORGANISATION_SCHEMA),
      __count: z.union([z.number(), z.string()]),
    }),
  ]),
});

function toOrganisation(row: z.infer<typeof CHARITY_ORGANISATION_SCHEMA>): CharityOrganisation {
  return {
    organisationId: row.OrganisationId,
    name: row.Name,
    registrationNumber: row.CharityRegistrationNumber ?? '',
    status: row.RegistrationStatus ?? '',
    registrationDate: row.DateRegistered,
    deregistrationDate: row.DeregistrationDate,
    website: row.WebSiteURL,
    email: row.EMailAddress1,
    phone: row.Telephone1,
    city: row.PostalAddressCity,
    nzbn: row.NZBNNumber,
    charitablePurpose: row.CharitablePurpose,
    lastModified: row.ModifiedOn,
  };
}

/**
 * Parses a Charities Register OData response into organisation records.
 * Accepts both the plain list shape and the inline-count shape.
 *
 * @param payload - Raw JSON from the Charities Register OData API.
 * @returns The matching organisations and the total match count.
 */
export function parseCharitiesRegister(payload: unknown): CharitiesSearchResult {
  const parsed = CHARITIES_RESPONSE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    throw new NzSourceParseError('Charities Register', parsed.error.message);
  }
  const data = parsed.data.d;
  const rows = Array.isArray(data) ? data : data.results;
  const count = Array.isArray(data) ? rows.length : Number(data.__count);
  return {
    count: Number.isNaN(count) ? rows.length : count,
    organisations: rows.map(toOrganisation),
  };
}

/**
 * Searches Charities Register organisation names. Keyless, no account.
 *
 * @param query - Name fragment to match, such as "red cross".
 * @param fetchImpl - Fetch implementation override for tests.
 * @returns Matching organisations and the total match count.
 */
export async function searchCharitiesRegister(
  query: string,
  fetchImpl: typeof globalThis.fetch = globalThis.fetch
): Promise<CharitiesSearchResult> {
  const escapedQuery = query.replace(/'/g, "''");
  const url = new URL('https://www.odata.charities.govt.nz/Organisations');
  url.searchParams.set('$filter', `substringof('${escapedQuery}',Name)`);
  url.searchParams.set('$top', '20');
  url.searchParams.set('$inlinecount', 'allpages');
  const response = await httpGet('Charities Register', url, {
    fetchImpl,
    headers: { Accept: 'application/json' },
  });
  return parseCharitiesRegister(await response.json());
}

/** Charities Register adapter: organisation name search, keyless. */
export const charitiesRegisterAdapter: NzDataAdapter<CharitiesSearchResult> = {
  id: CHARITIES_REGISTER_SOURCE_ID,
  name: 'Charities Register (DIA)',
  auth: 'none',
  description: 'Search New Zealand registered charities by name through the open OData API.',
  fetchLive: (options) => searchCharitiesRegister('red cross', options?.fetchImpl),
  parse: parseCharitiesRegister,
  loadFixture: () =>
    parseCharitiesRegister(readFixtureJson('charities-register-red-cross-2026-11-16.json')),
};
