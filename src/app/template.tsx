"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Fired as soon as the new route component tree is mounted into the DOM
    window.dispatchEvent(
      new CustomEvent("pinkfarm:route:mounted", {
        detail: { pathname },
      })
    );
  }, [pathname]);

  return <>{children}</>;
}
