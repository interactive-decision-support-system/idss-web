/** @jest-environment node */
/**
 * Tests for /best-laptops-for-[usecase] — verifies metadata generation
 * and static params for all configured use cases.
 */

import { generateStaticParams, generateMetadata } from "./page";
import {
  LAPTOP_USECASES,
  ALL_USECASE_SLUGS,
  BASE_URL,
} from "@/lib/seo-config";

describe("generateStaticParams", () => {
  it("returns an entry for every usecase slug", () => {
    const params = generateStaticParams();
    const slugs = params.map((p) => p.usecase);
    expect(new Set(slugs)).toEqual(new Set(ALL_USECASE_SLUGS));
  });

  it("returns objects with 'usecase' key", () => {
    const params = generateStaticParams();
    for (const p of params) {
      expect(typeof p.usecase).toBe("string");
      expect(p.usecase.length).toBeGreaterThan(0);
    }
  });
});

describe("generateMetadata", () => {
  it("returns correct title and description for students", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ usecase: "students" }),
    });
    expect(metadata.title).toBe(LAPTOP_USECASES.students.title);
    expect(metadata.description).toBe(LAPTOP_USECASES.students.description);
  });

  it("returns correct title and description for programming", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ usecase: "programming" }),
    });
    expect(metadata.title).toBe(LAPTOP_USECASES.programming.title);
    expect(metadata.description).toBe(LAPTOP_USECASES.programming.description);
  });

  it("includes canonical URL matching the usecase slug", async () => {
    for (const slug of ALL_USECASE_SLUGS) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ usecase: slug }),
      });
      expect(metadata.alternates?.canonical).toBe(
        `${BASE_URL}/best-laptops-for-${slug}`
      );
    }
  });

  it("includes openGraph title and url for each usecase", async () => {
    for (const slug of ALL_USECASE_SLUGS) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ usecase: slug }),
      });
      expect(typeof metadata.openGraph?.title).toBe("string");
      expect(metadata.openGraph?.url).toBe(
        `${BASE_URL}/best-laptops-for-${slug}`
      );
    }
  });

  it("returns empty object for unknown usecase (does not throw)", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ usecase: "nonexistent-usecase-xyz" }),
    });
    expect(metadata).toEqual({});
  });

  it("keywords include the usecase-specific terms", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ usecase: "students" }),
    });
    const keywords = metadata.keywords as string[];
    expect(keywords).toContain("best laptop for students");
  });
});
