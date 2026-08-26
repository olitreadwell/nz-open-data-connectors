# Glossary

Plain-language definitions. Terms used in this repo, in alphabetical order.

## A

- **ADE (Aotearoa Data Explorer)** - Stats NZ's data portal and API.

- **Adapter** - one piece of code that talks to one data source and
  returns plain objects. For example, `geonetAdapter`.

- **API** - a way for one program to ask another program for data.

- **Audit** - a tool that checks dependencies for known problems.

## C

- **Codelist** - a list of codes and their human-readable labels. Data can
  use codes like "ANIMALS" where the label is "Livestock".

- **CORS (Cross-Origin Resource Sharing)** - a browser rule that decides
  whether a page from one site may call an API on another site.

- **Coverage** - the share of code exercised by tests. 60% threshold means
  at least 60% of lines run during tests.

- **CSV** - comma-separated values. A common table format.

## D

- **Dataflow** - one dataset in the ADE catalogue, like `AGR_AGR_003`
  (agriculture by region).

- **Data.govt.nz** - the NZ government's open data catalogue.

- **DigitalNZ** - a search index of NZ digital cultural content.

- **Media search** - a DigitalNZ search filtered by media type (images,
  newspapers, videos, audio, literature, artwork). Records include preview
  image URLs where the source supplies them.

## E

- **E2E (end-to-end)** - a test that runs the real app over a real
  connection, like booting the HTTP server and calling it.

- **Endpoint** - one address that an API answers. For example, `/health`.

## F

- **Fixture** - a real snapshot of a live API response, stored in the repo
  and used by offline tests.

## G

- **GeoNet** - GNS Science's earthquake and geohazard monitoring service.

## I

- **Integration test** - a test that checks how pieces work together, such
  as routes wired to a client.

## J

- **JSON** - JavaScript Object Notation. A text format for data.

## K

- **Key** - a secret string that unlocks more of an API. Optional in this
  repo.

## L

- **LINZ** - Land Information New Zealand. Runs the property and land data
  platform.

- **Lint** - a tool that reads code and flags style and safety problems.

## O

- **Observation** - one row of data, for example one region in one year.

- **OpenAPI** - a machine-readable description of an API's endpoints.

## P

- **Probe** - a live test that checks whether a source answers and parses.

- **Port** - a copy of the same design in another language (Python, Ruby).

## R

- **Rate limit** - the maximum number of requests an API allows in a time
  window.

## S

- **SDMX** - the standard format Stats NZ uses to send data.

- **Smoke test** - a quick live test against the real service, opt-in via
  `RUN_SMOKE=1`.

- **Subscription key** - the key Stats NZ issues.

## T

- **Trade Me** - NZ's marketplace site, with a public category API.

- **Type-check** - a tool that proves code uses values of the right type.

## U

- **Unit test** - a test of one small piece of logic in isolation.

## Z

- **Zod** - a library that checks data against a schema and rejects bad
  input.
