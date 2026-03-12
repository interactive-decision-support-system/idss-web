/**
 * /best-laptops-under-[price] — SSR landing page for price-filtered laptop guides.
 *
 * Routes: /best-laptops-under-700, /best-laptops-under-1000, /best-laptops-under-1500
 * Each generates unique <title>, <meta description>, FAQPage JSON-LD, and CTA.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  PRICE_FILTER_PAGES,
  LAPTOP_USECASES,
  BASE_URL,
  ALL_PRICE_SLUGS,
} from "@/lib/seo-config";

export function generateStaticParams() {
  return ALL_PRICE_SLUGS.map((price) => ({ price }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ price: string }>;
}): Promise<Metadata> {
  const { price } = await params;
  const config = PRICE_FILTER_PAGES[price];
  if (!config) return {};

  return {
    title: config.title,
    description: config.description,
    keywords: [
      ...config.keywords,
      "IDSS",
      "AI laptop recommendations",
      "best value laptop",
    ],
    openGraph: {
      title: config.title,
      description: config.description,
      url: `${BASE_URL}/best-laptops-under-${price}`,
      siteName: "IDSS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
    alternates: {
      canonical: `${BASE_URL}/best-laptops-under-${price}`,
    },
  };
}

export default async function BestLaptopsUnderPricePage({
  params,
}: {
  params: Promise<{ price: string }>;
}) {
  const { price } = await params;
  const config = PRICE_FILTER_PAGES[price];
  if (!config) notFound();

  const chatUrl = `/?q=${encodeURIComponent(config.chatQuery)}`;

  // FAQ items for each price tier
  const faq = [
    {
      q: `What is the best laptop under $${config.price} in 2026?`,
      a: `Under $${config.price} you can find solid laptops with ${config.price <= 700 ? "Intel Core i5/AMD Ryzen 5, 16 GB RAM, and 256–512 GB SSD" : config.price <= 1000 ? "Intel Core i7/AMD Ryzen 7, 16 GB RAM, and 512 GB–1 TB SSD" : "dedicated GPU, 32 GB RAM, and 1 TB SSD"}. Our AI engine finds the current best options from our product database.`,
    },
    {
      q: `Is $${config.price} enough for a good laptop in 2026?`,
      a: config.price <= 700
        ? "Yes. $700 covers everyday tasks, light coding, and college coursework well. You won't get a premium build or dedicated GPU, but performance is solid for the price."
        : config.price <= 1000
        ? "Absolutely. The $700–$1,000 range is the sweet spot — you gain premium displays, better CPUs, and longer battery life without paying for the ultra-premium tier."
        : "At $1,000–$1,500 you can get workstation-class performance: dedicated GPU, OLED display, 32 GB RAM. This tier handles video editing, machine learning, and heavy development.",
    },
    {
      q: "Should I buy now or wait for a price drop?",
      a: "Laptop prices tend to drop during Black Friday, back-to-school season (July–August), and tax refund season (March–April). If your current machine is functional, waiting for a sale can save $100–$200. Otherwise, current models at your budget tier are well-optimised.",
    },
    {
      q: "What specs matter most at this price?",
      a: config.price <= 700
        ? "Prioritise RAM (16 GB minimum), SSD speed (NVMe over SATA), and battery life. CPU generation matters more than clock speed — a newer Core i5 beats an older i7."
        : "At this tier, display quality and build materials become meaningful differentiators alongside CPU/RAM. Look for IPS or OLED panels and metal chassis construction.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: config.title,
    description: config.description,
    url: `${BASE_URL}/best-laptops-under-${price}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "IDSS", item: BASE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Laptops",
          item: `${BASE_URL}/laptops`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: config.h1,
          item: `${BASE_URL}/best-laptops-under-${price}`,
        },
      ],
    },
  };

  // Related use-case links relevant to this price point
  const relatedUsecases =
    config.price <= 700
      ? ["students", "college"]
      : config.price <= 1000
      ? ["students", "programming", "college"]
      : ["programming", "machine-learning", "video-editing"];

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
        <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#8C1515] font-semibold text-lg">
            IDSS
          </Link>
          <Link
            href="/laptops"
            className="text-sm text-black/60 hover:text-[#8C1515] transition-colors"
          >
            ← All Guides
          </Link>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
          <nav className="text-xs text-black/40 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#8C1515]">IDSS</Link>
            {" › "}
            <Link href="/laptops" className="hover:text-[#8C1515]">Laptops</Link>
            {" › "}
            <span>{config.h1}</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{config.h1}</h1>
          <p className="text-base text-black/70 leading-relaxed mb-8">{config.intro}</p>

          <Link
            href={chatUrl}
            className="inline-flex items-center gap-2 bg-[#8C1515] text-white px-6 py-3 rounded-full font-medium hover:bg-[#750013] transition-colors mb-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Find best laptops under ${config.price} →
          </Link>

          {/* Price tier summary box */}
          <div className="bg-gray-50 rounded-xl p-5 mb-10 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">
              What ${config.price} buys you in 2026
            </h2>
            <ul className="space-y-1.5 text-sm text-black/65">
              {config.price <= 700 && (
                <>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>Intel Core i5 or AMD Ryzen 5 (10th–13th gen)</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>16 GB DDR4 RAM</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>256–512 GB NVMe SSD</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>8–10 hour battery life</li>
                  <li className="flex gap-2"><span className="text-black/30">✗</span>Dedicated GPU (rare at this price)</li>
                  <li className="flex gap-2"><span className="text-black/30">✗</span>OLED display</li>
                </>
              )}
              {config.price === 1000 && (
                <>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>Intel Core i7 or AMD Ryzen 7 (12th–14th gen)</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>16 GB DDR5 RAM (32 GB available)</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>512 GB–1 TB NVMe SSD</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>IPS or OLED display options</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>10–14 hour battery life</li>
                  <li className="flex gap-2"><span className="text-black/30">✗</span>Dedicated RTX GPU (rare under $1,000)</li>
                </>
              )}
              {config.price === 1500 && (
                <>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>Intel Core i7/i9 or Ryzen 9 (latest gen)</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>32 GB DDR5 RAM</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>1 TB NVMe SSD</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>Dedicated RTX 4060/4070 GPU</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>OLED or mini-LED display</li>
                  <li className="flex gap-2"><span className="text-[#8C1515]">✓</span>Premium build (metal chassis)</li>
                </>
              )}
            </ul>
          </div>

          {/* FAQ */}
          <section aria-labelledby="faq-heading" className="mb-10">
            <h2 id="faq-heading" className="text-xl font-semibold text-gray-900 mb-6">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faq.map(({ q, a }, i) => (
                <div key={i}>
                  <h3 className="font-medium text-gray-900 mb-1">{q}</h3>
                  <p className="text-sm text-black/65 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related use-case guides */}
          <section aria-labelledby="usecases-heading" className="mb-10">
            <h2 id="usecases-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Best laptops by use case at this budget
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedUsecases.map((slug) => {
                const uc = LAPTOP_USECASES[slug];
                if (!uc) return null;
                return (
                  <Link
                    key={slug}
                    href={`/best-laptops-for-${slug}`}
                    className="text-sm px-4 py-2 rounded-full border border-black/15 text-black/60 hover:border-[#8C1515] hover:text-[#8C1515] transition-colors"
                  >
                    {uc.h1.replace(" in 2026", "")}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Other price tiers */}
          <section aria-labelledby="price-heading" className="mb-10">
            <h2 id="price-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Other price ranges
            </h2>
            <div className="flex flex-wrap gap-3">
              {ALL_PRICE_SLUGS.filter((p) => p !== price).map((p) => {
                const pf = PRICE_FILTER_PAGES[p];
                return (
                  <Link
                    key={p}
                    href={`/best-laptops-under-${p}`}
                    className="text-sm px-4 py-2 rounded-full border border-black/15 text-black/60 hover:border-[#8C1515] hover:text-[#8C1515] transition-colors"
                  >
                    Under ${pf.price}
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            <p className="text-black/60 mb-4">
              Get AI-ranked picks tailored to your exact needs under ${config.price}.
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
          IDSS — Interactive Decision Support System · Stanford LDR Lab
        </footer>
      </div>
    </>
  );
}
