import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "example.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack alias to access i18n folder outside web directory
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@i18n": path.resolve(process.cwd(), "i18n"),
    };
    return config;
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
