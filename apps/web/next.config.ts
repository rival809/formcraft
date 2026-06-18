import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for Docker standalone build (copies only what's needed to run)
  output: 'standalone',
  // Turbopack is the default in Next.js 16 — no flag needed
  experimental: {
    // "use cache" directive support (stable in Next.js 16)
    dynamicIO: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.r2.dev' },
      // Allow GCP VM public IP and any future domain
      { protocol: 'http', hostname: '*' },
      { protocol: 'https', hostname: '*' },
    ],
  },
  // Internal API calls go directly to NestJS
  rewrites: async () => [
    {
      source: '/api/auth/:path*',
      destination: `${process.env.API_URL}/api/auth/:path*`,
    },
    {
      source: '/api/public/:path*',
      destination: `${process.env.API_URL}/api/public/:path*`,
    },
  ],
}

export default nextConfig
