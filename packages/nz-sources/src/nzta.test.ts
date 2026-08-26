import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { NzSourceApiError, NzSourceParseError } from "./errors";
import {
  fetchNztaHolidayHotspots,
  nztaAdapter,
  parseNztaHolidayHotspots,
} from "./nzta";

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      "src/fixtures/nzta-holiday-hotspots-2026-08-25.json",
    ),
    "utf8",
  ),
) as unknown;

const MIN_HOTSPOT_COUNT = 50;

describe("parseNztaHolidayHotspots", () => {
  it("parses the Waka Kotahi fixture into hotspots", () => {
    const hotspots = parseNztaHolidayHotspots(FIXTURE);
    expect(hotspots.length).toBeGreaterThan(MIN_HOTSPOT_COUNT);
    const first = hotspots[0];
    expect(first?.holidayName).toContain("Waitangi");
    expect(first?.regionTitle).toBe("Auckland");
    expect(first?.title).toContain("SH1");
    expect(first?.latitude).toBeLessThan(0);
    expect(first?.longitude).toBeGreaterThan(0);
  });

  it("rejects a payload that is not a hotspot map", () => {
    expect(() => parseNztaHolidayHotspots({ type: "Feature" })).toThrow(
      NzSourceParseError,
    );
  });
});

describe("fetchNztaHolidayHotspots", () => {
  it("fetches and parses a live response", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;
    const hotspots = await fetchNztaHolidayHotspots(fetchImpl);
    expect(hotspots.length).toBeGreaterThan(MIN_HOTSPOT_COUNT);
  });

  it("throws an API error on a non-ok response", async () => {
    const fetchImpl = (async () =>
      new Response("nope", { status: 503 })) as typeof fetch;
    await expect(fetchNztaHolidayHotspots(fetchImpl)).rejects.toThrow(
      NzSourceApiError,
    );
  });
});

describe("nztaAdapter", () => {
  it("loads the committed fixture", () => {
    const hotspots = nztaAdapter.loadFixture();
    expect(hotspots.length).toBeGreaterThan(MIN_HOTSPOT_COUNT);
  });
});
