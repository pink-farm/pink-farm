"use client";

import React, { useEffect, useState } from "react";

export interface LotusLoaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
  text?: string;
  subtext?: string;
  className?: string;
  speedSec?: number;
  navKey?: number | string;
}

const SIZES = {
  xs: { width: 52, height: 52, textClass: "text-xs" },
  sm: { width: 76, height: 76, textClass: "text-sm" },
  md: { width: 120, height: 120, textClass: "text-base" },
  lg: { width: 190, height: 190, textClass: "text-lg" },
  xl: { width: 260, height: 260, textClass: "text-xl" },
};

// Singleton in-memory Blob cache for zero-bandwidth, zero-lag frame-0 animation restart
let cachedLotusBlob: Blob | null = null;
let blobFetchPromise: Promise<Blob | null> | null = null;

export async function preloadLotusBlob(): Promise<Blob | null> {
  if (typeof window === "undefined") return null;
  if (cachedLotusBlob) return cachedLotusBlob;
  if (!blobFetchPromise) {
    blobFetchPromise = fetch("/images/lotus-loader.webp")
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (blob) cachedLotusBlob = blob;
        return blob;
      })
      .catch((err) => {
        console.warn("Could not preload lotus blob:", err);
        return null;
      });
  }
  return blobFetchPromise;
}

export function LotusLoader({
  size = "lg",
  fullScreen = false,
  text = "Loading Freshness...",
  subtext = "Crafted with pure care",
  className = "",
  navKey,
}: LotusLoaderProps) {
  const { width, height, textClass } = SIZES[size] || SIZES.lg;
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    let createdUrl = "";

    preloadLotusBlob().then((blob) => {
      if (!active || !blob) return;
      createdUrl = URL.createObjectURL(blob);
      setBlobUrl(createdUrl);
    });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [navKey]);

  const imgSrc = blobUrl || "/images/lotus-loader.webp";

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading..."
      className={`flex flex-col items-center justify-center select-none ${className}`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Pure Transparent Seamless Looping Lotus Bloom with Hardware Acceleration */}
        <div
          className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none"
          style={{
            transform: "translateZ(0)",
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={navKey ? `lotus-loader-${navKey}` : "lotus-loader-default"}
            src={imgSrc}
            alt="Pink Farm Lotus Bloom"
            width={width}
            height={height}
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>
      </div>

      {/* Typography matching luxury Pink Farm brand */}
      {text && (
        <div className="mt-3 text-center px-4 animate-fade-in z-20">
          <p className={`font-serif tracking-wide text-brand-green font-medium ${textClass}`}>
            {text}
          </p>
          {subtext && (
            <p className="text-xs uppercase tracking-widest text-brand-sage/80 mt-1 font-sans">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#FDFBF7]/92 backdrop-blur-md transition-all duration-300">
        {content}
      </div>
    );
  }

  return content;
}

export const MakhanaLoader = LotusLoader;
export default LotusLoader;
