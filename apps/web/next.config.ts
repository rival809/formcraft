import type { NextConfig } from 'next'

// API_URL is only available at runtime, not build time — fall back to internal
// Docker service name so rewrites are always valid during `next build`
const apiUrl = process.env.API_URL ?? 'http://api:4000'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'http', hostname: '*' },
      { protocol: 'https', hostname: '*' },
    ],
  },
  rewrites: async () => [
    {
      source: '/api/auth/:path*',
      destination: `${apiUrl}/api/auth/:path*`,
    },
    {
      source: '/api/public/:path*',
      destination: `${apiUrl}/api/public/:path*`,
    },
  ],
}

export default nextConfig
