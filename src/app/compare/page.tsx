/**
 * /compare — Hub listing all head-to-head comparison pages.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { COMPARISON_PAGES, BASE_URL } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Laptop Comparisons 2026 — Side-by-Side AI Analysis | IDSS",
  description:
    "Compare any two laptops side-by-side. AI-generated analysis across battery, display, performance, and value for 2026 models.",
  keywords: [
    "laptop comparison 2026",
    "compare laptops",
    "macbook vs dell",
    "best laptop side by side",
  ],
  openGraph: {
    title: "Laptop Comparisons 2026 | IDSS",
    description: "AI-generated side-by-side laptop comparisons.",
    url: `${BASE_URL}/compare`,
    siteName: "IDSS",
    type: "website",
  },
  alternates: { canonical: `${BASE_URL}/compare` },
};

export default function CompareHubPage() {
  const comparisons = Object.values(COMPARISON_PAGES);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-[#8C1515] font-semibold text-lg">
          IDSS
        </Link>
        <Link
          href="/laptops"
          className="text-sm text-black/60 hover:text-[#8C1515] transition-colors"
        >
          All Guides →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Laptop Comparisons
        </h1>
        <p className="text-black/65 mb-10">
          Side-by-side AI analysis of popular laptop pairs. Each comparison
          covers performance, battery, display, and which user each model suits
          best.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {comparisons.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group block border border-gray-100 rounded-xl p-5 hover:border-[#8C1515]/30 hover:shadow-sm transition-all"
            >
              <h2 className="font-semibold text-gray-900 group-hover:text-[#8C1515] mb-1 transition-colors">
                {c.product1} vs {c.product2}
              </h2>
              <p className="text-xs text-black/50 line-clamp-2">{c.description}</p>
            </Link>
          ))}
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <p className="text-black/60 text-sm mb-4">
            Need a comparison not listed? Type any two laptops into our AI.
          </p>
          <Link
            href="/?q=compare+macbook+air+vs+dell+xps"
            className="inline-flex items-center gap-2 bg-[#8C1515] text-white px-6 py-3 rounded-full font-medium hover:bg-[#750013] transition-colors"
          >
            Compare any laptops →
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-black/35">
        IDSS — Interactive Decision Support System · Stanford LDR Lab
      </footer>
    </div>
  );
}
