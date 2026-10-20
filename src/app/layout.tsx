import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pinkfarm.in"),
  title: "Pink Farm — Premium Makhana & Everyday Favourites",
  description: "Discover thoughtfully selected everyday favourites, with Makhana at the heart of Pink Farm. Goodness That Feels Like Home.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Pink Farm — Premium Makhana & Everyday Favourites",
    description: "Discover thoughtfully selected everyday favourites, with Makhana at the heart of Pink Farm. Goodness That Feels Like Home.",
    url: "https://pinkfarm.in",
    siteName: "Pink Farm",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pink Farm — Premium Makhana & Everyday Favourites",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pink Farm — Premium Makhana & Everyday Favourites",
    description: "Discover thoughtfully selected everyday favourites, with Makhana at the heart of Pink Farm. Goodness That Feels Like Home.",
    images: ["/images/og-image.png"],
  },
};

import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingSocials } from "@/components/ui/FloatingSocials";
import { BottomAnnouncementBar } from "@/components/layout/BottomAnnouncementBar";
import { LuxuryScrollProgressBar } from "@/components/ui/MotionWrappers";
import { SettingsSync } from "@/components/layout/SettingsSync";
import { MakhanaNavigationLoader } from "@/components/ui/MakhanaNavigationLoader";

export const instant = false;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pink Farm",
    url: "https://pinkfarm.in",
    logo: "https://pinkfarm.in/lotus-logo-gold.png",
    description: "Discover thoughtfully selected everyday favourites, with Makhana at the heart of Pink Farm.",
  };

  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/images/lotus-loader.webp" type="image/webp" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-brand-ivory text-brand-charcoal">
        <Suspense fallback={null}>
          <MakhanaNavigationLoader />
        </Suspense>
        <SettingsSync />
        <LuxuryScrollProgressBar />
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="flex-grow min-w-0 w-full overflow-x-clip">
          {children}
        </main>
        <Footer />
        <FloatingSocials />
        <Suspense fallback={null}>
          <BottomAnnouncementBar />
        </Suspense>
      </body>
    </html>
  );
}
