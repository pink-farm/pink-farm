import type { NextConfig } from "next";

const contentSecurityPolicy = (formAction: string, checkout = false) => {
  // NetBanking can open bank-owned HTTPS pages inside Razorpay's checkout flow.
  const paymentFrames = checkout ? "https:" : "https://razorpay.com https://*.razorpay.com";
  return `default-src 'self' https://razorpay.com https://*.razorpay.com; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action ${formAction} https://razorpay.com https://*.razorpay.com; frame-src 'self' ${paymentFrames}; child-src 'self' ${paymentFrames}; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; font-src 'self' data: https://razorpay.com https://*.razorpay.com; style-src 'self' 'unsafe-inline' https://razorpay.com https://*.razorpay.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://razorpay.com https://*.razorpay.com; worker-src 'self' blob: https://razorpay.com https://*.razorpay.com` +
  `; connect-src 'self' https://razorpay.com https://*.razorpay.com https://api.postalpincode.in https://vercel.com https://*.blob.vercel-storage.com; upgrade-insecure-requests`;
};

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: false,

  images: {
    qualities: [75, 100],
  },

  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), accelerometer=*, gyroscope=*" },
        { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy("'self'") },
        ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
      ],
    }, {
      source: "/checkout",
      headers: [
        // Razorpay may POST checkout form data to a bank-owned HTTPS endpoint for NetBanking.
        { key: "Content-Security-Policy", value: contentSecurityPolicy("'self' https:", true) },
        // Keep Razorpay's cross-origin payment popups connected to the checkout window.
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      ],
    }];
  },

  outputFileTracingIncludes: {
    "/**": ["./prisma/**/*"],
  },

  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
