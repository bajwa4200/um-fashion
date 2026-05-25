import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "http", hostname: "placehold.co" },
      { protocol: "http", hostname: "127.0.0.1", port: "9000" },
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    minimumCacheTTL: 86400,
  },
  transpilePackages: ["@um/database", "@um/shared"],
};

export default nextConfig;
