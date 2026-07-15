import type { NextConfig } from "next";

const YEAR = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  // Every raster asset in /public is already an optimized webp export;
  // serving them untouched avoids a sharp round-trip and keeps deploys portable.
  images: { unoptimized: true },
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      // The hero film + content photography never change between deploys —
      // cache them for a year so repeat visits never re-download a byte.
      { source: "/frame/:path*", headers: [{ key: "Cache-Control", value: YEAR }] },
      { source: "/location/:path*", headers: [{ key: "Cache-Control", value: YEAR }] },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: YEAR }] },
      {
        // The logo/favicon could conceivably change under the same name —
        // cache long but let it revalidate rather than lock it forever.
        source: "/logo/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
