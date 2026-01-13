import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IDSS Recommendation System | Stanford LDR Lab",
  description: "Interactive Decision Support System for recommendations",
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
      </body>
    </html>
  );
}
