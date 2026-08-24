import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { parseStatsNzCsv } from "./csv";

const LIVESTOCK_FIXTURE = readFileSync(
  new URL(
    "./fixtures/agricultural-livestock-regional-council-2025-08-17.csv",
    import.meta.url,
  ),
  "utf8",
);

describe("stats-nz performance", () => {
  it("parses the full real livestock fixture (19k+ rows) within 5 seconds", () => {
    const start = performance.now();
    const rows = parseStatsNzCsv(LIVESTOCK_FIXTURE, {
      dataflowId: "AGR_AGR_003",
    });
    const elapsedMs = performance.now() - start;
    expect(rows.length).toBeGreaterThan(19000);
    expect(elapsedMs).toBeLessThan(5000);
  });
});
