import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    domains: ["images.unsplash.com", "res.cloudinary.com", "example.com"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix for React Server Components chunk error
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Disable turbopack for development to avoid RSC issues
  turbo: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  // Webpack alias to access i18n folder outside web directory
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@i18n": path.resolve(__dirname, "../i18n"),
    };
    return config;
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
