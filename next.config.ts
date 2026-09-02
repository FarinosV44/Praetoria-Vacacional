import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is required by inline JSON-LD + Next hydration; external
  // scripts are still restricted to the allow-list below.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // `https:` (any host) so blog featured images (issue #57) can be pasted as a
  // URL without an upload pipeline. Scripts/styles/connect stay locked down.
  "img-src 'self' data: blob: https: https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://api.stripe.com",
  // Stripe checkout + the OpenStreetMap location embed on property pages (#87).
  "frame-src https://js.stripe.com https://hooks.stripe.com https://www.openstreetmap.org",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // ESLint + its config live in devDependencies (CI runs them). A production
  // host that installs with --omit=dev / NODE_ENV=production won't have eslint,
  // and `next build` would otherwise fail looking for it. `tsc` still runs in CI.
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage public bucket for property photos.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Guide URLs moved to destination hubs (issue #46). The old pillar guides
    // are now the hub pages themselves; Valencia guides moved segment.
    return [
      {
        source: "/guias/valencia/guia-playas-de-valencia",
        destination: "/guias/valencia-playa",
        permanent: true,
      },
      {
        source: "/guias/javalambre/guia-de-javalambre",
        destination: "/guias/javalambre",
        permanent: true,
      },
      { source: "/guias/valencia/:slug", destination: "/guias/valencia-playa/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
