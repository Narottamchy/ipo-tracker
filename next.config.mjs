import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Pages render from the shared Redis snapshots, so the CDN can serve them briefly and refresh
      // in the background. (The CDN cache is per-domain, which the per-host analytics ID relies on.)
      { source: '/', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=600' }] },
      { source: '/ipo/:slug/:id', headers: [{ key: 'Cache-Control', value: 'public, s-maxage=120, stale-while-revalidate=900' }] },
    ];
  },
};

export default nextConfig;
