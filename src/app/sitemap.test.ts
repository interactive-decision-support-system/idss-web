/** @jest-environment node */
/**
 * Tests for sitemap.ts — verifies all landing pages are included.
 */

import sitemap from "./sitemap";
import {
  BASE_URL,
  ALL_USECASE_SLUGS,
  ALL_COMPARISON_SLUGS,
  ALL_PRICE_SLUGS,
} from "@/lib/seo-config";

describe("sitemap()", () => {
  let entries: ReturnType<typeof sitemap>;
  let urls: Set<string>;

  beforeAll(() => {
    entries = sitemap();
    urls = new Set(entries.map((e) => e.url));
  });

  it("includes the homepage with priority 1", () => {
    const home = entries.find((e) => e.url === BASE_URL);
    expect(home).toBeDefined();
    expect(home?.priority).toBe(1);
  });

  it("includes the laptops hub page with priority >= 0.8", () => {
    const laptops = entries.find((e) => e.url === `${BASE_URL}/laptops`);
    expect(laptops).toBeDefined();
    expect(laptops?.priority).toBeGreaterThanOrEqual(0.8);
  });

  it("includes a page for every usecase slug", () => {
    for (const slug of ALL_USECASE_SLUGS) {
      expect(urls.has(`${BASE_URL}/best-laptops-for-${slug}`)).toBe(true);
    }
  });

  it("includes a page for every comparison slug", () => {
    for (const slug of ALL_COMPARISON_SLUGS) {
      expect(urls.has(`${BASE_URL}/compare/${slug}`)).toBe(true);
    }
  });

  it("includes a page for every price filter slug", () => {
    for (const slug of ALL_PRICE_SLUGS) {
      expect(urls.has(`${BASE_URL}/best-laptops-under-${slug}`)).toBe(true);
    }
  });

  it("all entries have a valid HTTPS url", () => {
    for (const entry of entries) {
      expect(entry.url.startsWith("https://")).toBe(true);
    }
  });

  it("all entries have a lastModified date", () => {
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });

  it("all entries have priority between 0 and 1", () => {
    for (const entry of entries) {
      if (entry.priority !== undefined) {
        expect(entry.priority).toBeGreaterThanOrEqual(0);
        expect(entry.priority).toBeLessThanOrEqual(1);
      }
    }
  });

  it("has no duplicate URLs", () => {
    const allUrls = entries.map((e) => e.url);
    expect(allUrls.length).toBe(new Set(allUrls).size);
  });

  it("total entry count matches expected", () => {
    const expected =
      5 + // home, laptops, compare, checkout, connect
      ALL_USECASE_SLUGS.length +
      ALL_COMPARISON_SLUGS.length +
      ALL_PRICE_SLUGS.length;
    expect(entries.length).toBe(expected);
  });
});
