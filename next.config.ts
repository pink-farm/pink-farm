import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  images: {
    qualities: [75, 100],
  },

  outputFileTracingIncludes: {
    "/**": ["./prisma/**/*"],
  },

  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
