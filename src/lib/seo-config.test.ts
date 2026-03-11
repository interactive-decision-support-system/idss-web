/**
 * Tests for seo-config.ts — verifies data integrity of all SEO configs.
 */

import {
  LAPTOP_USECASES,
  COMPARISON_PAGES,
  PRICE_FILTER_PAGES,
  ALL_USECASE_SLUGS,
  ALL_COMPARISON_SLUGS,
  ALL_PRICE_SLUGS,
  BASE_URL,
} from "./seo-config";

describe("LAPTOP_USECASES", () => {
  it("exports all expected slugs", () => {
    expect(ALL_USECASE_SLUGS).toContain("students");
    expect(ALL_USECASE_SLUGS).toContain("programming");
    expect(ALL_USECASE_SLUGS).toContain("gaming");
    expect(ALL_USECASE_SLUGS).toContain("college");
    expect(ALL_USECASE_SLUGS).toContain("machine-learning");
    expect(ALL_USECASE_SLUGS).toContain("video-editing");
  });

  it("each usecase has required fields", () => {
    const REQUIRED = ["slug","title","description","h1","intro","keyFeatures","buyingAdvice","chatQuery","faq","keywords"] as const;
    for (const [slug, uc] of Object.entries(LAPTOP_USECASES)) {
      for (const field of REQUIRED) {
        expect(uc[field]).toBeDefined();
      }
      expect(uc.slug).toBe(slug);
    }
  });

  it("title <= 70 chars for all usecases", () => {
    for (const uc of Object.values(LAPTOP_USECASES)) {
      expect(uc.title.length).toBeLessThanOrEqual(70);
    }
  });

  it("description <= 160 chars for all usecases", () => {
    for (const uc of Object.values(LAPTOP_USECASES)) {
      expect(uc.description.length).toBeLessThanOrEqual(160);
    }
  });

  it("each usecase has >= 3 key features", () => {
    for (const uc of Object.values(LAPTOP_USECASES)) {
      expect(uc.keyFeatures.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("each usecase has >= 2 FAQ items with non-empty q and a", () => {
    for (const uc of Object.values(LAPTOP_USECASES)) {
      expect(uc.faq.length).toBeGreaterThanOrEqual(2);
      for (const { q, a } of uc.faq) {
        expect(q.trim()).toBeTruthy();
        expect(a.trim()).toBeTruthy();
      }
    }
  });

  it("chatQuery is non-empty", () => {
    for (const uc of Object.values(LAPTOP_USECASES)) {
      expect(uc.chatQuery.trim()).toBeTruthy();
    }
  });

  it("ALL_USECASE_SLUGS matches Object.keys(LAPTOP_USECASES)", () => {
    expect(new Set(ALL_USECASE_SLUGS)).toEqual(new Set(Object.keys(LAPTOP_USECASES)));
  });
});

describe("COMPARISON_PAGES", () => {
  it("exports all expected comparison slugs", () => {
    expect(ALL_COMPARISON_SLUGS).toContain("macbook-air-vs-dell-xps");
    expect(ALL_COMPARISON_SLUGS).toContain("macbook-air-m3-vs-macbook-pro");
    expect(ALL_COMPARISON_SLUGS).toContain("lenovo-thinkpad-vs-hp-spectre");
    expect(ALL_COMPARISON_SLUGS).toContain("dell-xps-vs-lenovo-thinkpad");
  });

  it("each comparison has required fields and slug matches key", () => {
    const REQUIRED = ["slug","product1","product2","title","description","intro","chatQuery","keywords"] as const;
    for (const [slug, cp] of Object.entries(COMPARISON_PAGES)) {
      for (const field of REQUIRED) {
        expect(cp[field]).toBeDefined();
      }
      expect(cp.slug).toBe(slug);
    }
  });

  it("comparison slugs contain '-vs-'", () => {
    for (const slug of ALL_COMPARISON_SLUGS) {
      expect(slug).toContain("-vs-");
    }
  });

  it("comparison titles contain 'vs'", () => {
    for (const cp of Object.values(COMPARISON_PAGES)) {
      expect(cp.title.toLowerCase()).toContain("vs");
    }
  });

  it("ALL_COMPARISON_SLUGS matches Object.keys", () => {
    expect(new Set(ALL_COMPARISON_SLUGS)).toEqual(new Set(Object.keys(COMPARISON_PAGES)));
  });
});

describe("PRICE_FILTER_PAGES", () => {
  it("exports expected price slugs", () => {
    expect(ALL_PRICE_SLUGS).toContain("700");
    expect(ALL_PRICE_SLUGS).toContain("1000");
    expect(ALL_PRICE_SLUGS).toContain("1500");
  });

  it("each price filter has required fields and price matches slug", () => {
    const REQUIRED = ["slug","price","title","description","h1","intro","chatQuery","keywords"] as const;
    for (const [slug, pf] of Object.entries(PRICE_FILTER_PAGES)) {
      for (const field of REQUIRED) {
        expect(pf[field]).toBeDefined();
      }
      expect(String(pf.price)).toBe(slug);
    }
  });

  it("price values are positive", () => {
    for (const pf of Object.values(PRICE_FILTER_PAGES)) {
      expect(pf.price).toBeGreaterThan(0);
    }
  });
});

describe("BASE_URL", () => {
  it("is a valid HTTPS URL without trailing slash", () => {
    expect(BASE_URL.startsWith("https://")).toBe(true);
    expect(BASE_URL.endsWith("/")).toBe(false);
  });
});
