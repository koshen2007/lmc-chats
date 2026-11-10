/** @type {import('next').NextConfig} */

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://*.supabase.co https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.googleusercontent.com https://api.dicebear.com https://*.dicebear.com https://media.tenor.com https://*.giphy.com https://*.supabase.co;
  media-src 'self' data: blob: https://*.supabase.co https://media.tenor.com https://*.giphy.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://apis.google.com https://api.giphy.com;
  font-src 'self' https://fonts.gstatic.com data:;
  frame-src 'self' https://accounts.google.com;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
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
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
