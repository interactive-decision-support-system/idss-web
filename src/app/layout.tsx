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
    "AI shopping assistant",
    "laptop recommendations",
    "interactive decision support",
    "Stanford LDR Lab",
    "product comparison AI",
    "best laptop finder",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
