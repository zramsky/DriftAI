import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Static export disabled due to dynamic routes
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  reactStrictMode: true,
};

export default nextConfig;
