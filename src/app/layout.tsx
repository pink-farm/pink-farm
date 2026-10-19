import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pink Farm — Premium Makhana & Everyday Favourites",
  description: "Discover thoughtfully selected everyday favourites, with Makhana at the heart of Pink Farm. Goodness That Feels Like Home.",
};

import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingSocials } from "@/components/ui/FloatingSocials";
import { LuxuryScrollProgressBar } from "@/components/ui/MotionWrappers";
import { SettingsSync } from "@/components/layout/SettingsSync";
import { MakhanaNavigationLoader } from "@/components/ui/MakhanaNavigationLoader";

export const instant = false;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/images/lotus-loader.webp?v=4" type="image/webp" />
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
      </body>
    </html>
  );
}
