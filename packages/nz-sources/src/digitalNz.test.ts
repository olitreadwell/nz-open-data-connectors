import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  getDigitalNzCategoryFilter,
  parseDigitalNzRecords,
  searchDigitalNzMedia,
  type DigitalNzMediaType,
} from "./digitalNz.js";
import { NzSourceParseError } from "./errors.js";

function readFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "src/fixtures", name), "utf8"),
  );
}

const FIXTURE = readFixture("digitalnz-search-sheep.json");
const IMAGES_FIXTURE = readFixture("digitalnz-media-images-kiwi-20260827.json");

describe("parseDigitalNzRecords", () => {
  it("parses the DigitalNZ fixture into records", () => {
    const records = parseDigitalNzRecords(FIXTURE);
    expect(records.length).toBeGreaterThan(0);
    const first = records[0];
    expect(first?.title?.length).toBeGreaterThan(0);
    expect(first?.id).toBeGreaterThan(0);
  });

  it("rejects a payload without a search result", () => {
    expect(() => parseDigitalNzRecords({ search: {} })).toThrow(
      NzSourceParseError,
    );
  });
});

describe("getDigitalNzCategoryFilter", () => {
  it("maps every media type to a DigitalNZ category", () => {
    expect(getDigitalNzCategoryFilter("images")).toBe("Images");
    expect(getDigitalNzCategoryFilter("newspapers")).toBe("Newspapers");
    expect(getDigitalNzCategoryFilter("videos")).toBe("Videos");
    expect(getDigitalNzCategoryFilter("audio")).toBe("Audio");
    expect(getDigitalNzCategoryFilter("literature")).toBe("Books");
    expect(getDigitalNzCategoryFilter("artwork")).toBe("Images");
  });
});

describe("media search", () => {
  it("parses image records with preview URLs", () => {
    const records = parseDigitalNzRecords(IMAGES_FIXTURE);
    expect(records.length).toBeGreaterThan(0);
    const first = records[0];
    expect(first?.categories).toContain("Images");
    expect(first?.thumbnailUrl?.length).toBeGreaterThan(0);
  });

  it("filters the live request by category", async () => {
    const captured: string[] = [];
    const records = await searchDigitalNzMedia("kiwi", "newspapers", {
      fetchImpl: async (input) => {
        const url =
          input instanceof URL
            ? input.href
            : typeof input === "string"
              ? input
              : input.url;
        captured.push(url);
        return new Response(JSON.stringify(FIXTURE), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });
    expect(records.length).toBeGreaterThan(0);
    const url = captured[0];
    expect(url).toContain("text=kiwi");
    expect(url).toContain("and%5Bcategory%5D%5B%5D=Newspapers");
  });

  it("parses every committed media fixture", () => {
    const types: DigitalNzMediaType[] = [
      "images",
      "newspapers",
      "videos",
      "audio",
      "literature",
      "artwork",
    ];
    for (const mediaType of types) {
      const filename =
        mediaType === "artwork" || mediaType === "images"
          ? "digitalnz-media-images-kiwi-20260827.json"
          : mediaType === "literature"
            ? "digitalnz-media-books-kiwi-20260827.json"
            : `digitalnz-media-${mediaType}-kiwi-20260827.json`;
      const records = parseDigitalNzRecords(readFixture(filename));
      expect(records.length).toBeGreaterThan(0);
    }
  });
});
