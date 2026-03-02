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
  // Webpack alias to access i18n folder outside web directory
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@i18n": path.resolve(process.cwd(), "../i18n"),
    };
    return config;
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
