import type { NextConfig } from "next";

// CSP origins. Keep this list narrow — anything we fetch/connect to in the
// browser must be enumerated here, otherwise the request is blocked.
const CSP_CONNECT_SRC = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://api.mainnet-beta.solana.com",
  "https://*.helius-rpc.com",
  "https://*.helius.xyz",
  "https://pumpportal.fun",
  "wss://pumpportal.fun",
  "https://frontend-api.pump.fun",
  "https://frontend-api-v3.pump.fun",
  "https://ipfs.io",
  "https://*.pinata.cloud",
  "https://api.twitterapi.io",
  "https://api.higgsfield.ai",
  "https://api.anthropic.com",
  "https://vercel.live",
  "https://*.vercel-analytics.com",
  "https://*.vercel-insights.com",
];

const CSP_IMG_SRC = [
  "'self'",
  "data:",
  "blob:",
  "https:",
];

const CSP_FRAME_SRC = [
  "'self'",
  "https://vercel.live",
];

// 'unsafe-inline' / 'unsafe-eval' are required by Solana wallet adapter (WASM)
// and Next.js dev/HMR. They can be dropped once the wallet adapter ships a
// strict-CSP-friendly build.
const CSP_DIRECTIVES = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-analytics.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${CSP_IMG_SRC.join(" ")}`,
  `font-src 'self' data:`,
  `connect-src ${CSP_CONNECT_SRC.join(" ")}`,
  `frame-src ${CSP_FRAME_SRC.join(" ")}`,
  `worker-src 'self' blob:`,
  `media-src 'self' data: blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Solana wallet adapter packages need transpiling for Next.js
  transpilePackages: [
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-wallets",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
