/**
 * /laptops — Hub page linking to all laptop landing pages.
 * Server component, fully SSR, crawlable by search engines.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LAPTOP_USECASES, COMPARISON_PAGES, BASE_URL } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "AI Laptop Recommendations 2026 — Find Your Perfect Match | IDSS",
  description:
    "Browse AI-curated laptop guides for every use case: students, programmers, gamers, video editors, and more. Compare top models side-by-side.",
  keywords: [
    "best laptops 2026",
    "laptop recommendations",
    "AI laptop finder",
    "laptop buying guide",
    "laptop comparison",
  ],
  openGraph: {
    title: "AI Laptop Recommendations 2026",
    description:
      "Browse AI-curated laptop guides for every use case and budget.",
    url: `${BASE_URL}/laptops`,
    siteName: "IDSS",
    type: "website",
  },
  alternates: { canonical: `${BASE_URL}/laptops` },
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "AI Laptop Recommendations 2026",
  description:
    "Laptop buying guides organised by use case, price, and comparison.",
  url: `${BASE_URL}/laptops`,
};

export default function LaptopsHubPage() {
  const usecases = Object.values(LAPTOP_USECASES);
  const comparisons = Object.values(COMPARISON_PAGES);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />

      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#8C1515] font-semibold text-lg">
            IDSS
          </Link>
          <Link
            href="/"
            className="text-sm text-black/60 hover:text-[#8C1515] transition-colors"
          >
            AI Search →
          </Link>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Laptop Buying Guides
          </h1>
          <p className="text-black/65 mb-10">
            AI-curated recommendations for every use case and budget. Each guide
            surfaces the best laptops based on real specs — not sponsored
            rankings.
          </p>

          {/* Use-case guides */}
          <section aria-labelledby="usecases-heading" className="mb-12">
            <h2
              id="usecases-heading"
              className="text-xl font-semibold text-gray-900 mb-5"
            >
              Best laptops by use case
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {usecases.map((uc) => (
                <Link
                  key={uc.slug}
                  href={`/best-laptops-for-${uc.slug}`}
                  className="group block border border-gray-100 rounded-xl p-5 hover:border-[#8C1515]/30 hover:shadow-sm transition-all"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#8C1515] mb-1 transition-colors">
                    {uc.h1.replace(" in 2026", "")}
                  </h3>
                  <p className="text-xs text-black/50 line-clamp-2">
                    {uc.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Comparisons */}
          <section aria-labelledby="comparisons-heading" className="mb-12">
            <h2
              id="comparisons-heading"
              className="text-xl font-semibold text-gray-900 mb-5"
            >
              Head-to-head comparisons
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {comparisons.map((c) => (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}`}
                  className="group block border border-gray-100 rounded-xl p-5 hover:border-[#8C1515]/30 hover:shadow-sm transition-all"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#8C1515] mb-1 transition-colors">
                    {c.product1} vs {c.product2}
                  </h3>
                  <p className="text-xs text-black/50 line-clamp-2">
                    {c.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* AI chat CTA */}
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Can&apos;t find your use case?
            </h2>
            <p className="text-sm text-black/60 mb-5">
              Ask our AI directly. It handles any query — from &quot;best laptop
              for Blender under $1,500&quot; to &quot;compare ThinkPad vs XPS
              for a data scientist.&quot;
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#8C1515] text-white px-8 py-3 rounded-full font-medium hover:bg-[#750013] transition-colors"
            >
              Start AI Recommendation →
            </Link>
          </div>
        </main>

        <footer className="border-t border-gray-100 py-6 text-center text-xs text-black/35">
          IDSS — Interactive Decision Support System · Stanford LDR Lab
        </footer>
      </div>
    </>
  );
}
