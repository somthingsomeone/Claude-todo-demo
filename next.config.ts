import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Everything the browser loads comes from this site. (Supabase is only called from the server.)
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // The local database engine uses Node features and must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  poweredByHeader: false,
  experimental: {
    // Doctor photos are uploaded through the admin page (max 1.5 MB each).
    serverActions: { bodySizeLimit: "2mb" },
  },
  // The intro page «ما هو بانيفو؟» is a static page (public/intro/index.html), served at /intro.
  async rewrites() {
    return [{ source: "/intro", destination: "/intro/index.html" }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The static intro page cannot read SITE_LIVE itself, so it stays out of search engines by header until launch.
      ...(process.env.SITE_LIVE === "true"
        ? []
        : [{ source: "/intro/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
           { source: "/intro", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]),
      // Admin pages are never cached by shared caches or indexed.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
