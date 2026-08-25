import { describe, expect, it } from "vitest";
import {
  galleryImages,
  heroCopy,
  sourceLinks,
  timelineEntries,
  tributeCards,
} from "./memorialContent";

describe("memorialContent", () => {
  it("keeps hero copy short enough for the hero discipline", () => {
    const heroSubtitleWordLimit = 20;
    expect(heroCopy.subtitle.split(" ").length).toBeLessThanOrEqual(
      heroSubtitleWordLimit,
    );
    expect(heroCopy.cta).not.toHaveLength(0);
  });

  it("orders timeline entries by year", () => {
    const years = timelineEntries.map((entry) => Number(entry.year));
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it("gives every tribute card a source url and a quote", () => {
    for (const card of tributeCards) {
      expect(card.url).toMatch(/^https:\/\//);
      expect(card.quote).toBeTruthy();
    }
  });

  it("links every gallery image to its commons source", () => {
    for (const image of galleryImages) {
      expect(image.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org/);
      expect(image.credit).not.toHaveLength(0);
    }
  });

  it("points every source link at a real url", () => {
    for (const link of sourceLinks) {
      expect(link.url).toMatch(/^https:\/\//);
    }
  });
});
