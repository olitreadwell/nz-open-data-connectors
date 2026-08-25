import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { NzSourceApiError, NzSourceParseError } from "./errors";
import { mfeAdapter, parseMfeLayers, searchMfeLayers } from "./mfe";

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      "src/fixtures/mfe-layer-search-water-2026-08-25.json",
    ),
    "utf8",
  ),
) as unknown;

describe("parseMfeLayers", () => {
  it("parses the MfE layer search fixture into layers", () => {
    const layers = parseMfeLayers(FIXTURE);
    expect(layers.length).toBeGreaterThan(50);
    const first = layers[0];
    expect(first?.id).toBe(117733);
    expect(first?.title).toContain("LUCAS");
    expect(first?.url).toContain("117733");
    expect(first?.publicAccess).toBe("download");
  });

  it("rejects a payload that is not a layer search response", () => {
    expect(() => parseMfeLayers({ type: "FeatureCollection" })).toThrow(
      NzSourceParseError,
    );
  });
});

describe("searchMfeLayers", () => {
  it("fetches and parses a live response", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;
    const layers = await searchMfeLayers("water", fetchImpl);
    expect(layers.length).toBeGreaterThan(50);
  });

  it("throws an API error on a non-ok response", async () => {
    const fetchImpl = (async () =>
      new Response("nope", { status: 500 })) as typeof fetch;
    await expect(searchMfeLayers("water", fetchImpl)).rejects.toThrow(
      NzSourceApiError,
    );
  });
});

describe("mfeAdapter", () => {
  it("loads the committed fixture", () => {
    const layers = mfeAdapter.loadFixture();
    expect(layers.length).toBeGreaterThan(50);
  });
});
