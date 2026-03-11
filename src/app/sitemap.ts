import { MetadataRoute } from "next";
import {
  BASE_URL,
  ALL_USECASE_SLUGS,
  ALL_COMPARISON_SLUGS,
  ALL_PRICE_SLUGS,
} from "@/lib/seo-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Core app pages
  const corePages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/laptops`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/checkout`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/connect`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Best-of landing pages: /best-laptops-for-[usecase]
  const usecasePages: MetadataRoute.Sitemap = ALL_USECASE_SLUGS.map(
    (usecase) => ({
      url: `${BASE_URL}/best-laptops-for-${usecase}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  );

  // Comparison pages: /compare/[slug]
  const comparisonPages: MetadataRoute.Sitemap = ALL_COMPARISON_SLUGS.map(
    (slug) => ({
      url: `${BASE_URL}/compare/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })
  );

  // Price-filter pages: /best-laptops-under-[price]
  const pricePages: MetadataRoute.Sitemap = ALL_PRICE_SLUGS.map((price) => ({
    url: `${BASE_URL}/best-laptops-under-${price}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...corePages,
    ...usecasePages,
    ...comparisonPages,
    ...pricePages,
  ];
}
