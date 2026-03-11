import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IDSS — AI Shopping Assistant | Stanford LDR Lab",
    template: "%s | IDSS",
  },
  description:
    "IDSS is an AI-powered interactive decision support system that helps you find the best laptops, books, and products through natural conversation. Built by Stanford LDR Lab.",
  keywords: [
    // Brand / product
    "AI shopping assistant",
    "IDSS",
    "interactive decision support system",
    "Stanford LDR Lab",
    // High-intent buyer keywords
    "best laptop for students",
    "best laptop for programming",
    "best gaming laptop 2026",
    "best laptop under 1000",
    "best lightweight laptop",
    "laptop comparison AI",
    "macbook air vs dell xps",
    // Technical / research
    "agentic commerce",
    "MCP merchant backend",
    "Model Context Protocol shopping",
    "Universal Commerce Protocol",
    "knowledge graph e-commerce",
    "multi-agent shopping system",
    "LLM product recommendation",
    "Stanford AI research",
  ],
  authors: [{ name: "Stanford LDR Lab" }],
  openGraph: {
    title: "IDSS — AI Shopping Assistant",
    description:
      "Find the best products through natural conversation. Powered by AI, built by Stanford LDR Lab.",
    url: "https://idss.vercel.app",
    siteName: "IDSS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IDSS — AI Shopping Assistant",
    description:
      "Find the best products through natural conversation. Powered by AI, built by Stanford LDR Lab.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "IDSS — Merchant Agent Framework",
  description:
    "Protocol-compatible agentic e-commerce system supporting MCP, UCP, and ACP for multi-agent shopping with knowledge graph reasoning. Built at Stanford LDR Lab.",
  applicationCategory: "AI Shopping Assistant",
  operatingSystem: "Web",
  url: "https://idss.vercel.app",
  author: [
    {
      "@type": "Person",
      name: "Juli Huang",
      affiliation: {
        "@type": "Organization",
        name: "Stanford University",
      },
    },
    {
      "@type": "Person",
      name: "Hannah Clay",
      affiliation: {
        "@type": "Organization",
        name: "Stanford University",
      },
    },
    {
      "@type": "Person",
      name: "Thomas Sarda",
      affiliation: {
        "@type": "Organization",
        name: "Stanford University",
      },
    },
    {
      "@type": "Person",
      name: "Sajjad Beygi",
      affiliation: {
        "@type": "Organization",
        name: "Stanford University",
      },
    },
  ],
  keywords:
    "agentic commerce, MCP, UCP, ACP, AI shopping, knowledge graph, multi-agent systems, Model Context Protocol, Universal Commerce Protocol",
  isAccessibleForFree: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
