/** OpenAPI 3.0 document for the connectors API. Served at /openapi.json. */
export const OPEN_API_DOCUMENT = {
  openapi: '3.0.3',
  info: {
    title: 'NZ Open Data Connectors',
    version: '0.1.0',
    description:
      'Language-agnostic HTTP wrapper over NZ public data connectors. ' +
      'API keys stay server-side; every endpoint works keyless unless noted.',
  },
  paths: {
    '/openapi.json': {
      get: {
        summary: 'OpenAPI specification',
        responses: { '200': { description: 'OpenAPI 3.0 document' } },
      },
    },
    '/docs': {
      get: {
        summary: 'Swagger UI',
        responses: { '200': { description: 'HTML page' } },
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        responses: { '200': { description: 'Service is up' } },
      },
    },
    '/metrics': {
      get: {
        summary: 'Prometheus metrics',
        responses: {
          '200': { description: 'Request counters in Prometheus text format' },
        },
      },
    },
    '/api/sources': {
      get: {
        summary: 'List every data source adapter with optional licence metadata',
        description:
          'Returns every adapter in the registry. Adapters with a source-wide ' +
          'licence include `license` with `title`, `url` and `attribution`.',
        responses: {
          '200': {
            description: 'Adapter list with optional `license` metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/NzSource' },
                },
              },
            },
          },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/sources/{id}/probe': {
      get: {
        summary: 'Live probe one source',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Probe result' },
          '400': { description: 'Missing or invalid source id' },
          '404': { description: 'Unknown source id' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/digitalnz/media': {
      get: {
        summary: 'Search DigitalNZ media (images, newspapers, videos, audio, literature, artwork)',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['images', 'newspapers', 'videos', 'audio', 'literature', 'artwork'],
            },
          },
        ],
        responses: {
          '200': { description: 'Media records with preview image URLs' },
          '400': { description: 'Missing or empty q' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/stats-nz/catalogue': {
      get: {
        summary: 'List every Aotearoa Data Explorer dataflow',
        responses: {
          '200': { description: 'Dataflow list' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/stats-nz/data': {
      get: {
        summary: 'Pull data rows for a dataflow',
        parameters: [
          {
            name: 'dataflowId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'format',
            in: 'query',
            schema: { type: 'string', enum: ['json', 'csv'] },
          },
        ],
        responses: {
          '200': { description: 'Rows as JSON or CSV' },
          '400': { description: 'Missing or invalid dataflowId' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/stats-nz/codelist': {
      get: {
        summary: 'Resolve dimension codes to labels',
        parameters: [
          {
            name: 'codelistId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Codelist items' },
          '400': { description: 'Missing or invalid codelistId' },
          '401': { description: 'Subscription key required' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
  },
  components: {
    schemas: {
      NzSourceLicense: {
        type: 'object',
        description: 'Licence and attribution metadata for a source-wide licence.',
        required: ['title', 'url', 'attribution'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', minLength: 1 },
          url: { type: 'string', format: 'uri' },
          attribution: { type: 'string', minLength: 1 },
        },
      },
      NzSource: {
        type: 'object',
        description: 'One registered data source adapter.',
        required: ['id', 'name', 'auth', 'description'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          auth: { type: 'string', enum: ['none', 'key', 'account'] },
          description: { type: 'string', minLength: 1 },
          license: { $ref: '#/components/schemas/NzSourceLicense' },
        },
      },
    },
  },
} as const;
