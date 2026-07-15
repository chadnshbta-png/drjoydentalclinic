import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every raster asset in /public is already an optimized webp export;
  // serving them untouched avoids a sharp round-trip and keeps deploys portable.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        // The hero film never changes between deploys — cache it hard.
        source: "/frame/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
