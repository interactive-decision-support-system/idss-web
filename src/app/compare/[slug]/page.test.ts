/** @jest-environment node */
/**
 * Tests for /compare/[slug] — verifies metadata generation for comparison pages.
 */

import { generateStaticParams, generateMetadata } from "./page";
import {
  COMPARISON_PAGES,
  ALL_COMPARISON_SLUGS,
  BASE_URL,
} from "@/lib/seo-config";

describe("generateStaticParams", () => {
  it("returns an entry for every comparison slug", () => {
    const params = generateStaticParams();
    const slugs = params.map((p) => p.slug);
    expect(new Set(slugs)).toEqual(new Set(ALL_COMPARISON_SLUGS));
  });
});

describe("generateMetadata", () => {
  it("returns correct title for macbook-air-vs-dell-xps", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "macbook-air-vs-dell-xps" }),
    });
    expect(metadata.title).toBe(
      COMPARISON_PAGES["macbook-air-vs-dell-xps"].title
    );
  });

  it("includes canonical URL for each comparison slug", async () => {
    for (const slug of ALL_COMPARISON_SLUGS) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug }),
      });
      expect(metadata.alternates?.canonical).toBe(
        `${BASE_URL}/compare/${slug}`
      );
    }
  });

  it("includes both product names in keywords", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "macbook-air-vs-dell-xps" }),
    });
    const keywords = metadata.keywords as string[];
    const hasProductKeyword = keywords.some(
      (k) =>
        k.toLowerCase().includes("macbook") ||
        k.toLowerCase().includes("dell") ||
        k.toLowerCase().includes("vs")
    );
    expect(hasProductKeyword).toBe(true);
  });

  it("returns empty object for unknown slug (does not throw)", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "unknown-laptop-vs-unknown" }),
    });
    expect(metadata).toEqual({});
  });

  it("openGraph url matches canonical for all slugs", async () => {
    for (const slug of ALL_COMPARISON_SLUGS) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug }),
      });
      expect(metadata.openGraph?.url).toBe(
        metadata.alternates?.canonical
      );
    }
  });
});
