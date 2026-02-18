import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrendYummy - AI Trend Analysis",
  description: "Real-time trend analysis and content generation dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className={`${outfit.className} antialiased selection:bg-neon-cyan/30 selection:text-neon-cyan`}>
        <div className="min-h-screen bg-transparent text-foreground">
          {children}
        </div>
      </body>
    </html>
  );
}
