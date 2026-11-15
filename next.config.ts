import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }, { protocol: "https", hostname: "images.unsplash.com" }] },
};

export default nextConfig;
