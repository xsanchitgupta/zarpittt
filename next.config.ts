import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Enable Next.js image optimization (WebP, responsive srcsets, lazy loading)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
    // Optimized breakpoints for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp', 'image/avif'],
    // Reduce image optimization time
    minimumCacheTTL: 3600,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    // Optimize client-side JS
    optimizePackageImports: ['lucide-react'],
  },
  // Surface real effect/render bugs during development
  reactStrictMode: true,
  // Enable gzip/brotli compression
  compress: true,
  // Don't leak the framework version
  poweredByHeader: false,
  // Security + performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Clickjacking protection
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Block MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Limit referrer leakage to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Force HTTPS for a year (safe: the site is HTTPS-only in prod)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Lock down powerful browser features to this origin only
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self), payment=(self)' },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
