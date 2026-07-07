import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Security Headers ────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },

  // ─── Image Optimization ──────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
  },

  // ─── Experimental ────────────────────────────────────────────────
  experimental: {
    // Optimize package imports for tree-shaking
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "@tanstack/react-query",
      "date-fns",
      "firebase",
    ],
  },

  // ─── TypeScript & ESLint ─────────────────────────────────────────
  typescript: {
    // Fail build on type errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Fail build on lint errors
    ignoreDuringBuilds: false,
  },

  // ─── Logging ─────────────────────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default nextConfig;
