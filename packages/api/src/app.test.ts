import { describe, expect, it } from "vitest";

import { probeNzDataSource } from "@nzlab/nz-sources";
import type { StatsNzClient } from "@nzlab/stats-nz";

import { createConnectorsApp } from "./index";
import { OPEN_API_DOCUMENT } from "./openapi";

function createStubStatsNzClient(): StatsNzClient {
  return {
    getDataflowCatalogue: async () => [
      {
        id: "AGR_AGR_003",
        agencyId: "STATSNZ",
        version: "1.0",
        title: "Agricultural production",
      },
    ],
    getData: async (_request) => [
      { dimensions: { YEAR: "2024", AREA: "Auckland" }, value: 10 },
      { dimensions: { YEAR: "2024", AREA: "Wellington" }, value: 20 },
    ],
    getCodelist: async (id) => ({
      id,
      agencyId: "STATSNZ",
      version: "1.0",
      items: [{ id: "2024", name: "Year ended June 2024" }],
    }),
  };
}

const stubProbe: typeof probeNzDataSource = async (adapter) => ({
  id: adapter.id,
  name: adapter.name,
  auth: adapter.auth,
  ok: true,
  status: "ok",
});

function createTestApp(): ReturnType<typeof createConnectorsApp> {
  return createConnectorsApp({
    statsNzClient: createStubStatsNzClient(),
    probeFn: stubProbe,
  });
}

describe("createConnectorsApp", () => {
  it("answers the health check", async () => {
    const app = createTestApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      name: "nz-open-data-connectors",
    });
  });

  it("serves the OpenAPI document", async () => {
    const app = createTestApp();
    const res = await app.request("/openapi.json");
    expect(res.status).toBe(200);
    const doc = (await res.json()) as { paths: Record<string, unknown> };
    expect(doc.paths["/api/sources"]).toBeDefined();
    expect(doc.paths["/api/stats-nz/data"]).toBeDefined();
  });

  it("serves the Swagger UI at /docs", async () => {
    const app = createTestApp();
    const res = await app.request("/docs");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("swagger");
  });

  it("registers every documented path", () => {
    const app = createTestApp();
    const registered = [...new Set(app.routes.map((route) => route.path))]
      .filter((path) => path !== "/api/*")
      .map((path) => path.replaceAll(":id", "{id}"))
      .sort();
    const documented = Object.keys(OPEN_API_DOCUMENT.paths).sort();
    expect(registered).toEqual(documented);
  });

  it("lists every adapter with id, name, auth, and description", async () => {
    const app = createTestApp();
    const res = await app.request("/api/sources");
    expect(res.status).toBe(200);
    const sources = (await res.json()) as Array<{
      id: string;
      name: string;
      auth: string;
      description: string;
    }>;
    expect(sources.length).toBeGreaterThanOrEqual(8);
    for (const source of sources) {
      expect(source.id.length).toBeGreaterThan(0);
      expect(source.name.length).toBeGreaterThan(0);
      expect(["none", "key", "account"]).toContain(source.auth);
      expect(source.description.length).toBeGreaterThan(0);
    }
  });

  it("probes a known source", async () => {
    const app = createTestApp();
    const res = await app.request("/api/sources/linz/probe");
    expect(res.status).toBe(200);
    const probe = (await res.json()) as { id: string; ok: boolean };
    expect(probe.id).toBe("linz");
    expect(probe.ok).toBe(true);
  });

  it("returns 404 for an unknown source", async () => {
    const app = createTestApp();
    const res = await app.request("/api/sources/not-a-source/probe");
    expect(res.status).toBe(404);
  });

  it("returns the dataflow catalogue", async () => {
    const app = createTestApp();
    const res = await app.request("/api/stats-nz/catalogue");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { dataflows: Array<{ id: string }> };
    expect(body.dataflows[0]?.id).toBe("AGR_AGR_003");
  });

  it("returns data rows as JSON by default", async () => {
    const app = createTestApp();
    const res = await app.request("/api/stats-nz/data?dataflowId=AGR_AGR_003");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      dataflowId: string;
      rows: Array<{ value: number }>;
    };
    expect(body.dataflowId).toBe("AGR_AGR_003");
    expect(body.rows).toHaveLength(2);
  });

  it("returns data rows as CSV when format=csv", async () => {
    const app = createTestApp();
    const res = await app.request(
      "/api/stats-nz/data?dataflowId=AGR_AGR_003&format=csv",
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(await res.text()).toContain("AREA,YEAR,value");
  });

  it("rejects a missing dataflowId", async () => {
    const app = createTestApp();
    const res = await app.request("/api/stats-nz/data");
    expect(res.status).toBe(400);
  });

  it("returns a codelist", async () => {
    const app = createTestApp();
    const res = await app.request("/api/stats-nz/codelist?codelistId=CL_YEAR");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      items: Array<{ id: string }>;
    };
    expect(body.id).toBe("CL_YEAR");
    expect(body.items[0]?.id).toBe("2024");
  });
});
