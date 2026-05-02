import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const r2Url = process.env.R2_PUBLIC_URL;

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  images: {
    remotePatterns: [
      ...(r2Url
        ? [{ hostname: new URL(r2Url).hostname, protocol: "https" as const }]
        : []),
    ],
    localPatterns: [
      { pathname: '/api/media/file/**' },
      { pathname: '/seed-images/**' },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // CSP is now set per-request in middleware.ts with nonces
        ],
      },
    ];
  },
};

export default withNextIntl(config);
