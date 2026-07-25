import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimizações para Vercel
  reactStrictMode: true,

  // Imagens otimizadas
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },

  // Webhook do Mercado Pago precisa de body raw
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
