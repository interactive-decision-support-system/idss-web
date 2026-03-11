/**
 * /best-laptops-for-[usecase] — Server-rendered SEO landing page.
 *
 * Generates a fully crawlable HTML page for each laptop use case
 * (students, programming, gaming, etc.) with:
 *   - Unique <title> and <meta description>
 *   - H1 with target keyword
 *   - Key features list
 *   - FAQ section with JSON-LD FAQPage schema
 *   - CTA linking to main chat with pre-filled query
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  LAPTOP_USECASES,
  BASE_URL,
  ALL_USECASE_SLUGS,
} from "@/lib/seo-config";

// ---------------------------------------------------------------------------
// Static params — tells Next.js which [usecase] values to pre-render
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return ALL_USECASE_SLUGS.map((usecase) => ({ usecase }));
}

// ---------------------------------------------------------------------------
// Per-page metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ usecase: string }>;
}): Promise<Metadata> {
  const { usecase } = await params;
  const config = LAPTOP_USECASES[usecase];
  if (!config) return {};

  return {
    title: config.title,
    description: config.description,
    keywords: [
      ...config.keywords,
      "IDSS",
      "AI laptop recommendations",
      "Stanford LDR Lab",
    ],
    openGraph: {
      title: config.title,
      description: config.description,
      url: `${BASE_URL}/best-laptops-for-${usecase}`,
      siteName: "IDSS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
    alternates: {
      canonical: `${BASE_URL}/best-laptops-for-${usecase}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function BestLaptopsForUsecasePage({
  params,
}: {
  params: Promise<{ usecase: string }>;
}) {
  const { usecase } = await params;
  const config = LAPTOP_USECASES[usecase];
  if (!config) notFound();

  // JSON-LD: FAQPage schema
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  // JSON-LD: WebPage schema
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: config.title,
    description: config.description,
    url: `${BASE_URL}/best-laptops-for-${usecase}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "IDSS",
          item: BASE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: config.h1,
          item: `${BASE_URL}/best-laptops-for-${usecase}`,
        },
      ],
    },
  };

  const chatUrl = `/?q=${encodeURIComponent(config.chatQuery)}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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
            <span>{config.h1}</span>
          </nav>

          {/* H1 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{config.h1}</h1>

          {/* Intro */}
          <p className="text-base text-black/70 leading-relaxed mb-8">
            {config.intro}
          </p>

          {/* CTA — main draw to the AI app */}
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
            Get personalized AI recommendations →
          </Link>

          {/* Key features */}
          <section aria-labelledby="features-heading" className="mb-10">
            <h2
              id="features-heading"
              className="text-xl font-semibold text-gray-900 mb-4"
            >
              What to look for
            </h2>
            <ul className="space-y-2">
              {config.keyFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-black/70">
                  <span className="text-[#8C1515] mt-0.5 shrink-0">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Buying advice */}
          <section aria-labelledby="advice-heading" className="mb-10">
            <h2
              id="advice-heading"
              className="text-xl font-semibold text-gray-900 mb-3"
            >
              Buying advice
            </h2>
            <p className="text-black/70 leading-relaxed">{config.buyingAdvice}</p>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq-heading" className="mb-10">
            <h2
              id="faq-heading"
              className="text-xl font-semibold text-gray-900 mb-6"
            >
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {config.faq.map(({ q, a }, i) => (
                <div key={i}>
                  <h3 className="font-medium text-gray-900 mb-1">{q}</h3>
                  <p className="text-black/65 leading-relaxed text-sm">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related pages */}
          <section aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="text-xl font-semibold text-gray-900 mb-4"
            >
              Related guides
            </h2>
            <div className="flex flex-wrap gap-3">
              {ALL_USECASE_SLUGS.filter((s) => s !== usecase)
                .slice(0, 4)
                .map((s) => {
                  const rel = LAPTOP_USECASES[s];
                  return (
                    <Link
                      key={s}
                      href={`/best-laptops-for-${s}`}
                      className="text-sm px-4 py-2 rounded-full border border-black/15 text-black/60 hover:border-[#8C1515] hover:text-[#8C1515] transition-colors"
                    >
                      {rel.h1.replace(" in 2026", "")}
                    </Link>
                  );
                })}
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-black/60 mb-4">
              Ready to find your perfect laptop? Let our AI ask the right questions.
            </p>
            <Link
              href={chatUrl}
              className="inline-flex items-center gap-2 bg-[#8C1515] text-white px-8 py-3 rounded-full font-medium hover:bg-[#750013] transition-colors"
            >
              Start AI Recommendation →
            </Link>
          </div>
        </main>

        <footer className="border-t border-gray-100 py-6 text-center text-xs text-black/35">
          <p>
            IDSS — Interactive Decision Support System · Stanford LDR Lab ·{" "}
            <Link href="/" className="hover:text-[#8C1515]">
              idss.vercel.app
            </Link>
          </p>
        </footer>
      </div>
    </>
  );
}
