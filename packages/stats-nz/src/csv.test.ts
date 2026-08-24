import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { parseCsv, parseStatsNzCsv, serializeStatsNzRowsToCsv } from "./csv";
import { StatsNzParseError } from "./errors";

const LIVESTOCK_FIXTURE = readFileSync(
  new URL(
    "./fixtures/agricultural-livestock-regional-council-2025-08-17.csv",
    import.meta.url,
  ),
  "utf8",
);

describe("parseCsv", () => {
  it("parses a header and rows with numeric and empty fields", () => {
    const rows = parseCsv("a,b,c\n1,2,3\nx,,z");
    expect(rows).toEqual([
      { a: "1", b: "2", c: "3" },
      { a: "x", b: "", c: "z" },
    ]);
  });

  it("handles CRLF line endings and a UTF-8 BOM", () => {
    const rows = parseCsv("\uFEFFa,b\r\n1,2\r\n");
    expect(rows).toEqual([{ a: "1", b: "2" }]);
  });

  it("handles quoted fields with commas, newlines, and escaped quotes", () => {
    const rows = parseCsv('a,b\n"x, y","line1\nline2"\n"he said ""hi""",z');
    expect(rows).toEqual([
      { a: "x, y", b: "line1\nline2" },
      { a: 'he said "hi"', b: "z" },
    ]);
  });

  it("returns an empty array for an empty document", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("throws StatsNzParseError when a row has more fields than the header", () => {
    expect(() => parseCsv("a,b,c\n1,2,3,4")).toThrow(StatsNzParseError);
  });
});

describe("parseStatsNzCsv", () => {
  it("parses the real livestock fixture into observations", () => {
    const rows = parseStatsNzCsv(LIVESTOCK_FIXTURE, {
      dataflowId: "AGR_AGR_003",
    });
    expect(rows.length).toBeGreaterThan(19000);
    const nationalSheep2024 = rows.find(
      (row) =>
        row.dimensions.LIVESTOCK === "6731" &&
        row.dimensions.AREA === "20" &&
        row.dimensions.YEAR === "2024",
    );
    expect(nationalSheep2024?.value).toBe(23583001);
  });

  it("exposes dimension ids without the dataflow suffix", () => {
    const rows = parseStatsNzCsv(
      "DATAFLOW,LIVESTOCK_AGR_AGR_003,OBS_VALUE\nSTATSNZ:AGR_AGR_003(1.0),6731,123\n",
      { dataflowId: "AGR_AGR_003" },
    );
    expect(rows[0]?.dimensions).toEqual({ LIVESTOCK: "6731" });
    expect(rows[0]?.value).toBe(123);
  });

  it("keeps blank observation values as null and preserves status", () => {
    const rows = parseStatsNzCsv(
      "DATAFLOW,LIVESTOCK_AGR_AGR_003,YEAR_AGR_AGR_003,OBS_VALUE,OBS_STATUS\nSTATSNZ:AGR_AGR_003(1.0),6731,2025,,s\n",
      { dataflowId: "AGR_AGR_003" },
    );
    expect(rows[0]?.value).toBeNull();
    expect(rows[0]?.status).toBe("s");
  });

  it("reads label columns from csvfilewithlabels output", () => {
    const rows = parseStatsNzCsv(
      "DATAFLOW,LIVESTOCK_AGR_AGR_003,LIVESTOCK_LABEL_AGR_AGR_003,OBS_VALUE\nSTATSNZ:AGR_AGR_003(1.0),6731,Sheep,1\n",
      { dataflowId: "AGR_AGR_003" },
    );
    expect(rows[0]?.labels).toEqual({ LIVESTOCK: "Sheep" });
  });

  it("throws when the CSV has no OBS_VALUE column", () => {
    expect(() =>
      parseStatsNzCsv("DATAFLOW,X_Y\nSTATSNZ:A(1.0),1\n", { dataflowId: "X" }),
    ).toThrow(StatsNzParseError);
  });
});

describe("serializeStatsNzRowsToCsv", () => {
  it("returns an empty string for no rows", () => {
    expect(serializeStatsNzRowsToCsv([])).toBe("");
  });

  it("writes dimension columns, value, and status when present", () => {
    const rows = [
      { dimensions: { YEAR: "2024", AREA: "Auckland" }, value: 10 },
      {
        dimensions: { YEAR: "2024", AREA: "Wellington" },
        value: 20,
        status: "A",
      },
    ];
    expect(serializeStatsNzRowsToCsv(rows)).toBe(
      "AREA,YEAR,value,status\nAuckland,2024,10,\nWellington,2024,20,A",
    );
  });

  it("escapes commas, quotes, and newlines in dimension values", () => {
    const rows = [{ dimensions: { AREA: 'a,b "c"\nline' }, value: 1 }];
    expect(serializeStatsNzRowsToCsv(rows)).toBe(
      'AREA,value\n"a,b ""c""\nline",1',
    );
  });

  it("round-trips through parseCsv for a simple table", () => {
    const rows = [
      { dimensions: { YEAR: "2024", AREA: "Auckland" }, value: 10 },
      { dimensions: { YEAR: "2024", AREA: "Wellington" }, value: 20 },
    ];
    const csv = serializeStatsNzRowsToCsv(rows);
    expect(parseCsv(csv)).toEqual([
      { AREA: "Auckland", YEAR: "2024", value: "10" },
      { AREA: "Wellington", YEAR: "2024", value: "20" },
    ]);
  });
});
