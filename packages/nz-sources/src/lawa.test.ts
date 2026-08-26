import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { NzSourceApiError, NzSourceParseError } from "./errors";
import {
  fetchLawaRiverQualitySites,
  lawaAdapter,
  parseLawaRiverQualitySites,
} from "./lawa";

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      "src/fixtures/lawa-river-quality-sites-2026-08-25.json",
    ),
    "utf8",
  ),
) as unknown;

const MIN_SITE_COUNT = 1000;
const FIRST_SITE_ID = 7787;

describe("parseLawaRiverQualitySites", () => {
  it("parses the LAWA fixture into monitoring sites", () => {
    const sites = parseLawaRiverQualitySites(FIXTURE);
    expect(sites.length).toBeGreaterThan(MIN_SITE_COUNT);
    const first = sites[0];
    expect(first?.id).toBe(FIRST_SITE_ID);
    expect(first?.name).toBe("Awanui at FNDC");
    expect(first?.code).toBe("NRC-00016");
    expect(first?.latitude).toBeLessThan(0);
    expect(first?.longitude).toBeGreaterThan(0);
  });

  it("drops region boundary rows from the payload", () => {
    const sites = parseLawaRiverQualitySites(FIXTURE);
    const regionRows = sites.filter((site) => site.code === "NORTHLAND");
    expect(regionRows).toHaveLength(0);
  });

  it("rejects a payload that is not a site list", () => {
    expect(() => parseLawaRiverQualitySites({ type: "Feature" })).toThrow(
      NzSourceParseError,
    );
  });
});

describe("fetchLawaRiverQualitySites", () => {
  it("fetches and parses a live response", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify(FIXTURE), { status: 200 })) as typeof fetch;
    const sites = await fetchLawaRiverQualitySites(fetchImpl);
    expect(sites.length).toBeGreaterThan(MIN_SITE_COUNT);
  });

  it("throws an API error on a non-ok response", async () => {
    const fetchImpl = (async () =>
      new Response("nope", { status: 503 })) as typeof fetch;
    await expect(fetchLawaRiverQualitySites(fetchImpl)).rejects.toThrow(
      NzSourceApiError,
    );
  });
});

describe("lawaAdapter", () => {
  it("loads the committed fixture", () => {
    const sites = lawaAdapter.loadFixture();
    expect(sites.length).toBeGreaterThan(MIN_SITE_COUNT);
  });
});
