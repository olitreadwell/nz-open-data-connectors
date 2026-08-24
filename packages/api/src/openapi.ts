/** OpenAPI 3.0 document for the connectors API. Served at /openapi.json. */
export const OPEN_API_DOCUMENT = {
  openapi: "3.0.3",
  info: {
    title: "NZ Open Data Connectors",
    version: "0.1.0",
    description:
      "Language-agnostic HTTP wrapper over NZ public data connectors. " +
      "API keys stay server-side; every endpoint works keyless unless noted.",
  },
  paths: {
    "/openapi.json": {
      get: {
        summary: "OpenAPI specification",
        responses: { "200": { description: "OpenAPI 3.0 document" } },
      },
    },
    "/docs": {
      get: {
        summary: "Swagger UI",
        responses: { "200": { description: "HTML page" } },
      },
    },
    "/health": {
      get: {
        summary: "Health check",
        responses: { "200": { description: "Service is up" } },
      },
    },
    "/api/sources": {
      get: {
        summary: "List every data source adapter",
        responses: { "200": { description: "Adapter list" } },
      },
    },
    "/api/sources/{id}/probe": {
      get: {
        summary: "Live probe one source",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Probe result" },
          "404": { description: "Unknown source id" },
        },
      },
    },
    "/api/stats-nz/catalogue": {
      get: {
        summary: "List every Aotearoa Data Explorer dataflow",
        responses: { "200": { description: "Dataflow list" } },
      },
    },
    "/api/stats-nz/data": {
      get: {
        summary: "Pull data rows for a dataflow",
        parameters: [
          {
            name: "dataflowId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "format",
            in: "query",
            schema: { type: "string", enum: ["json", "csv"] },
          },
        ],
        responses: {
          "200": { description: "Rows as JSON or CSV" },
          "400": { description: "Missing or invalid dataflowId" },
        },
      },
    },
    "/api/stats-nz/codelist": {
      get: {
        summary: "Resolve dimension codes to labels",
        parameters: [
          {
            name: "codelistId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Codelist items" },
          "401": { description: "Subscription key required" },
        },
      },
    },
  },
} as const;
