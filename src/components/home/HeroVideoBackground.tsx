"use client";

import React, { useEffect, useRef, useState } from "react";

export interface HeroVideoBackgroundProps {
  videoUrl?: string | null;
  opacity?: number | null;
}

export function HeroVideoBackground({
  videoUrl,
  opacity = 55,
}: HeroVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;

    if (conn?.saveData || conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
      return;
    }

    // Defer video stream request until after the initial page and lotus animation hydrate
    // This frees 100% of network bandwidth and GPU pipelines for instant first paint
    const timer = setTimeout(() => {
      setCanLoad(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canLoad) return;

    // Pause video playback whenever hero scrolls off-screen or tab switches
    // Eliminates all background CPU/GPU contention across the entire store
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          if (entry.isIntersecting && !document.hidden) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.05 }
    );

    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    observer.observe(videoRef.current);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, [canLoad]);

  if (!videoUrl) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
      style={{
        transform: "translateZ(0)",
        opacity: Math.max(0, Math.min(100, opacity ?? 55)) / 100,
      }}
    >
      {canLoad && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover transition-opacity duration-700 ease-out"
          style={{ willChange: "transform" }}
        >
          <source src={videoUrl} />
        </video>
      )}
    </div>
  );
}

export default HeroVideoBackground;
