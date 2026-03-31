/**
 * /compare/[slug] — Server-rendered SEO comparison landing page.
 *
 * Routes like /compare/macbook-air-vs-dell-xps generate:
 *   - Unique <title> with both product names
 *   - FAQPage JSON-LD + Product JSON-LD for both items
 *   - Comparison table HTML (crawlable)
 *   - CTA to open main chat with comparison pre-filled
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  COMPARISON_PAGES,
  BASE_URL,
  ALL_COMPARISON_SLUGS,
} from "@/lib/seo-config";

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return ALL_COMPARISON_SLUGS.map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// Per-page metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = COMPARISON_PAGES[slug];
  if (!config) return {};

  return {
    title: config.title,
    description: config.description,
    keywords: [
      ...config.keywords,
      "laptop comparison",
      "IDSS",
      "AI product comparison",
    ],
    openGraph: {
      title: config.title,
      description: config.description,
      url: `${BASE_URL}/compare/${slug}`,
      siteName: "IDSS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
    alternates: {
      canonical: `${BASE_URL}/compare/${slug}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Shared comparison dimensions — shown as a crawlable table
// ---------------------------------------------------------------------------

const COMPARISON_DIMENSIONS = [
  { key: "price", label: "Price range" },
  { key: "display", label: "Display" },
  { key: "battery", label: "Battery life" },
  { key: "weight", label: "Weight" },
  { key: "ports", label: "Ports" },
  { key: "os", label: "Operating system" },
  { key: "best_for", label: "Best for" },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = COMPARISON_PAGES[slug];
  if (!config) notFound();

  const { product1, product2 } = config;
  const chatUrl = `/?q=${encodeURIComponent(config.chatQuery)}`;

  // JSON-LD: WebPage with breadcrumb
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: config.title,
    description: config.description,
    url: `${BASE_URL}/compare/${slug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "IDSS", item: BASE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Compare",
          item: `${BASE_URL}/compare`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${product1} vs ${product2}`,
          item: `${BASE_URL}/compare/${slug}`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#8C1515] font-semibold text-lg">
            IDSS
          </Link>
          <Link
            href="/"
            className="text-sm text-black/60 hover:text-[#8C1515] transition-colors"
          >
            ← Back to AI Search
          </Link>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <nav className="text-xs text-black/40 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#8C1515]">
              IDSS
            </Link>
            {" › "}
            <Link href="/compare" className="hover:text-[#8C1515]">
              Compare
            </Link>
            {" › "}
            <span>
              {product1} vs {product2}
            </span>
          </nav>

          {/* H1 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product1} vs {product2}
          </h1>

          {/* Intro */}
          <p className="text-base text-black/70 leading-relaxed mb-8">
            {config.intro}
          </p>

          {/* CTA */}
          <Link
            href={chatUrl}
            className="inline-flex items-center gap-2 bg-[#8C1515] text-white px-6 py-3 rounded-full font-medium hover:bg-[#750013] transition-colors mb-10"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Let AI compare these for my needs →
          </Link>

          {/* Comparison dimensions table — crawlable for SEO */}
          <section aria-labelledby="compare-table-heading" className="mb-10">
            <h2
              id="compare-table-heading"
              className="text-xl font-semibold text-gray-900 mb-4"
            >
              Key differences at a glance
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-black/50 font-medium">
                      Dimension
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">
                      {product1}
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">
                      {product2}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {COMPARISON_DIMENSIONS.map(({ key, label }) => (
                    <tr key={key} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-black/50">{label}</td>
                      <td className="px-4 py-3 text-black/70">
                        Ask AI →
                      </td>
                      <td className="px-4 py-3 text-black/70">
                        Ask AI →
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-black/40">
              Our AI pulls live spec data from the product database.{" "}
              <Link
                href={chatUrl}
                className="text-[#8C1515] hover:underline"
              >
                Start comparison →
              </Link>
            </p>
          </section>

          {/* Which should you choose section */}
          <section aria-labelledby="choose-heading" className="mb-10">
            <h2
              id="choose-heading"
              className="text-xl font-semibold text-gray-900 mb-4"
            >
              Which should you choose?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Choose {product1} if…
                </h3>
                <p className="text-sm text-black/65">
                  You prefer its ecosystem, design philosophy, and the specific
                  trade-offs it makes in performance vs. portability. Ask our AI
                  for your specific requirements.
                </p>
              </div>
              <div className="border border-gray-100 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Choose {product2} if…
                </h3>
                <p className="text-sm text-black/65">
                  Its strengths align better with how you work. Our AI can
                  factor in your budget, software, and daily workflow to give
                  a personalised verdict.
                </p>
              </div>
            </div>
          </section>

          {/* AI CTA */}
          <section className="bg-gray-50 rounded-2xl p-8 text-center mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Not sure which one is right for you?
            </h2>
            <p className="text-black/60 text-sm mb-5">
              Tell our AI your budget, use case, and priorities. It will pick
              the winner for your specific situation.
            </p>
            <Link
              href={chatUrl}
              className="inline-flex items-center gap-2 bg-[#8C1515] text-white px-8 py-3 rounded-full font-medium hover:bg-[#750013] transition-colors"
            >
              Get my personalised recommendation →
            </Link>
          </section>

          {/* Related comparisons */}
          <section aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="text-xl font-semibold text-gray-900 mb-4"
            >
              More comparisons
            </h2>
            <div className="flex flex-wrap gap-3">
              {ALL_COMPARISON_SLUGS.filter((s) => s !== slug)
                .slice(0, 4)
                .map((s) => {
                  const rel = COMPARISON_PAGES[s];
                  return (
                    <Link
                      key={s}
                      href={`/compare/${s}`}
                      className="text-sm px-4 py-2 rounded-full border border-black/15 text-black/60 hover:border-[#8C1515] hover:text-[#8C1515] transition-colors"
                    >
                      {rel.product1} vs {rel.product2}
                    </Link>
                  );
                })}
            </div>
          </section>
        </main>

        <footer className="border-t border-gray-100 py-6 text-center text-xs text-black/35">
          <p>
            IDSS — Interactive Decision Support System · Stanford LDR Lab ·{" "}
            <Link href="/" className="hover:text-[#8C1515]">
              idss-web.vercel.app
            </Link>
          </p>
        </footer>
      </div>
    </>
  );
}
