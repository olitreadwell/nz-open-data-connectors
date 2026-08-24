import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseDataGovtDatastoreRows } from "./dataGovtDatastore";
import { NzSourceParseError } from "./errors";

const FIXTURE = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      "src/fixtures/data-govt-datastore-msd-benefits.json",
    ),
    "utf8",
  ),
) as unknown;

describe("parseDataGovtDatastoreRows", () => {
  it("parses the MSD benefit datastore fixture into rows", () => {
    const result = parseDataGovtDatastoreRows(FIXTURE);
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(result.records.length);
    const first = result.records[0];
    expect(first?.Quarter).toMatch(/^Sep_1[0-9]$/);
    expect(first?.Benefit_Group).toBe("Jobseeker Support");
    expect(typeof first?.Count).toBe("number");
  });

  it("rejects a payload that is not a CKAN datastore response", () => {
    expect(() =>
      parseDataGovtDatastoreRows({ success: false, error: {} }),
    ).toThrow(NzSourceParseError);
  });
});
