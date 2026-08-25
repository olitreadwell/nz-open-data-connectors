import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { NzSourceApiError, NzSourceParseError } from "./errors";
import { lrisAdapter, parseLrisLayers, searchLrisLayers } from "./lris";

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      "src/fixtures/lris-layer-search-soil-2026-08-25.json",
    ),
    "utf8",
  ),
) as unknown;

describe("parseLrisLayers", () => {
  it("parses the LRIS layer search fixture into layers", () => {
    const layers = parseLrisLayers(FIXTURE);
    expect(layers.length).toBeGreaterThan(50);
    const first = layers[0];
    expect(first?.id).toBe(123148);
    expect(first?.title).toContain("LCDB");
    expect(first?.url).toContain("123148");
    expect(first?.publicAccess).toBe("download");
  });

  it("rejects a payload that is not a layer search response", () => {
    expect(() => parseLrisLayers({ type: "FeatureCollection" })).toThrow(
      NzSourceParseError,
    );
  });
});

describe("searchLrisLayers", () => {
  it("fetches and parses a live response", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;
    const layers = await searchLrisLayers("soil", fetchImpl);
    expect(layers.length).toBeGreaterThan(50);
  });

  it("throws an API error on a non-ok response", async () => {
    const fetchImpl = (async () =>
      new Response("nope", { status: 500 })) as typeof fetch;
    await expect(searchLrisLayers("soil", fetchImpl)).rejects.toThrow(
      NzSourceApiError,
    );
  });
});

describe("lrisAdapter", () => {
  it("loads the committed fixture", () => {
    const layers = lrisAdapter.loadFixture();
    expect(layers.length).toBeGreaterThan(50);
  });
});
