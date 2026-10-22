"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Wait for the browser to complete layout and initial paint of the new route
    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        window.dispatchEvent(
          new CustomEvent("pinkfarm:route:mounted", {
            detail: {
              pathname,
              url: typeof window !== "undefined" ? window.location.pathname + window.location.search : pathname,
            },
          })
        );
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [pathname]);

  return <>{children}</>;
}
