import type { NextConfig } from "next";

// Build allowed origins list from NEXT_PUBLIC_APP_URL for server-action CSRF protection.
// This ensures server actions (file uploads, form saves) work on custom subdomains.
function getAllowedOrigins(): string[] {
  const origins: string[] = []
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      origins.push(new URL(appUrl).host)
    } catch { /* invalid URL, skip */ }
  }
  // Always allow the Netlify deploy URL if present
  const netlifyUrl = process.env.URL || process.env.DEPLOY_URL
  if (netlifyUrl) {
    try {
      origins.push(new URL(netlifyUrl).host)
    } catch { /* skip */ }
  }
  return origins
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
