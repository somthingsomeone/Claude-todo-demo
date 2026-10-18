import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The local database engine uses Node features and must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  poweredByHeader: false,
  experimental: {
    // Doctor photos are uploaded through the admin page (max 1.5 MB each).
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
