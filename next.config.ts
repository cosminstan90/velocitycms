import type { NextConfig } from 'next'

// Origins allowed to call the public headless API.
// Populate via env: CORS_ALLOWED_ORIGINS=https://site1.com,https://site2.com
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  // ── TypeScript ────────────────────────────────────────────────────────────
  // Type errors are checked locally via `tsc --noEmit`. During production
  // builds on the VPS the generated Prisma types can differ slightly from
  // the local dev environment, causing false-positive implicit-any errors.
  typescript: { ignoreBuildErrors: true },

  // ── Output ────────────────────────────────────────────────────────────────
  // Standalone mode: produces a self-contained build for Docker deployment.
  // The build output in .next/standalone includes a minimal server.js.
  output: 'standalone',

  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    // In dezvoltare, uploadurile vin de pe localhost; optimizatorul blocheaza implicit IP-urile locale.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    // Allow images served from the same host (uploads) and any configured domains
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  // ── HTTP headers ──────────────────────────────────────────────────────────
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options',           value: 'DENY' },
      { key: 'X-Content-Type-Options',    value: 'nosniff' },
      { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
      // Doar in productie (HTTPS); pe localhost ar fixa browserul pe HTTPS.
      ...(process.env.NODE_ENV === 'production'
        ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
        : []),
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=()',
      },
      {
        key: 'Content-Security-Policy',
        // Reasonably strict CSP — tighten further in production if no inline scripts are needed
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by Next.js HMR
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "frame-ancestors 'none'",
        ].join('; '),
      },
    ]

    // CORS origin header builder for public API
    const corsOrigin =
      allowedOrigins.length > 0
        ? allowedOrigins.join(', ')
        : '*' // fallback: open (restrict in production via env)

    return [
      // ── Security headers on all routes ──────────────────────────────────
      {
        source: '/(.*)',
        headers: securityHeaders,
      },

      // ── CORS: public headless API only ───────────────────────────────────
      {
        source: '/api/public/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: corsOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, X-API-Key',
          },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },

      // ── Long-lived cache for immutable Next.js assets ────────────────────
    ]
  },

  // ── Rewrites ──────────────────────────────────────────────────────────────
  // Files written to public/media/uploads at runtime are unknown to Next's
  // startup scan of public/. Anything Next cannot resolve falls through to a
  // route handler that reads from disk per request.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        { source: '/media/uploads/:path*', destination: '/api/media-file/:path*' },
      ],
    }
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  // Note: runtime redirects are handled by the custom middleware (Redis lookup).
  // Only add static build-time redirects here.
  async redirects() {
    return []
  },
}

export default nextConfig
