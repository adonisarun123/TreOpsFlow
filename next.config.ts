import type { NextConfig } from "next";

/**
 * Extract hostname from a URL string or bare hostname.
 * Handles: "https://knot.trebound.com", "knot.trebound.com", "http://localhost:3000"
 */
function extractHost(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    // If it looks like a bare hostname (no protocol), prepend https://
    const url = trimmed.includes('://') ? trimmed : `https://${trimmed}`
    return new URL(url).host // host includes port if non-standard
  } catch {
    // Last resort: use the raw value (handles "knot.trebound.com" without URL parsing)
    return trimmed.replace(/\/+$/, '')
  }
}

/**
 * Build allowed origins for server-action CSRF protection.
 * Critical for custom domains on Netlify where Origin header (custom domain)
 * may not match the x-forwarded-host header (Netlify internal domain).
 *
 * Reads from:
 * - NEXT_PUBLIC_APP_URL: Your custom domain (e.g. knot.trebound.com)
 * - URL / DEPLOY_URL: Netlify's auto-injected deploy URLs
 * - ALLOWED_ORIGINS: Explicit comma-separated override (optional)
 */
function getAllowedOrigins(): string[] {
  const origins = new Set<string>()

  // 1. Custom domain from NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    const host = extractHost(appUrl)
    if (host) origins.add(host)
  }

  // 2. Netlify auto-injected URLs (always available during Netlify builds)
  for (const envKey of ['URL', 'DEPLOY_URL', 'DEPLOY_PRIME_URL']) {
    const val = process.env[envKey]
    if (val) {
      const host = extractHost(val)
      if (host) origins.add(host)
    }
  }

  // 3. NEXTAUTH_URL (in case it differs from APP_URL)
  const authUrl = process.env.NEXTAUTH_URL
  if (authUrl) {
    const host = extractHost(authUrl)
    if (host) origins.add(host)
  }

  // 4. Explicit override: comma-separated list of allowed origins
  const explicit = process.env.ALLOWED_ORIGINS
  if (explicit) {
    for (const raw of explicit.split(',')) {
      const host = extractHost(raw)
      if (host) origins.add(host)
    }
  }

  const result = [...origins]
  // Log at build time so we can debug Netlify build logs
  if (result.length > 0) {
    console.log('[next.config] Server Action allowedOrigins:', result.join(', '))
  } else {
    console.warn('[next.config] WARNING: No allowedOrigins resolved — server actions may fail on custom domains')
  }
  return result
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    localPatterns: [
      { pathname: '/**' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb', // Supports file uploads (10MB validation limit + overhead)
      allowedOrigins: getAllowedOrigins(), // Allow custom subdomain + Netlify URL for CSRF
    },
  } as NextConfig["experimental"], // Type assertion for experimental features

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
