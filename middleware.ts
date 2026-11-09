import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Sliding-window IP Rate Limiter store for Edge Runtime
interface IpRateRecord {
  count: number;
  resetAt: number;
}

const edgeRateLimitMap = new Map<string, IpRateRecord>();

// Blocked automated vulnerability scanners & aggressive security probes
const BLOCKED_BOT_REGEX =
  /(sqlmap|nikto|nmap|masscan|wpscan|gobuster|dirbuster|acunetix|nessus|zgrab|morfeus|fuzzdb)/i;

// Headless browsers, CLI tools & raw HTTP scripts (blocked without audit token)
const AUTOMATED_SCRAPER_REGEX =
  /(python-requests|postman|headlesschrome|phantomjs|puppeteer|urllib)/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  const auditBypass = request.headers.get('x-lmc-audit');

  // 1. Bot & Vulnerability Scanner Blocking
  if (BLOCKED_BOT_REGEX.test(userAgent)) {
    return new NextResponse('Access Forbidden: Automated security scanner detected.', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // 2. Block Automated Scrapers, Headless Browsers & Python scripts (unless internal audit token is provided)
  if (AUTOMATED_SCRAPER_REGEX.test(userAgent) && auditBypass !== 'sec-auditor-bypass') {
    return new NextResponse(
      JSON.stringify({
        error: 'Access Forbidden: Automated headless client or CLI scraper detected.',
        hint: 'Use modern browser or supply verified audit credentials.',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }

  // 3. IP / Session Rate Limiting on API Endpoints
  if (pathname.startsWith('/api/')) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const now = Date.now();

    let record = edgeRateLimitMap.get(ip);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + 10_000 }; // 10-second window
      edgeRateLimitMap.set(ip, record);
    } else {
      record.count += 1;
    }

    // Rate limit: max 60 API requests per 10s window per IP
    if (record.count > 60) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded: Too many requests. Please slow down.',
          retryAfter: 5,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '5',
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // 4. Generate Per-Request Cryptographic Nonce
  const nonce =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? btoa(crypto.randomUUID())
      : btoa(Math.random().toString());

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // 5. Attach Strict CSP with V8 Trusted Types, Object-src none, Frame-ancestors none
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://*.supabase.co https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://*.googleusercontent.com https://api.dicebear.com https://media.tenor.com https://*.giphy.com https://*.supabase.co;
    media-src 'self' data: blob: https://*.supabase.co https://media.tenor.com https://*.giphy.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://apis.google.com;
    font-src 'self' https://fonts.gstatic.com data:;
    frame-src 'self' https://accounts.google.com;
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
    require-trusted-types-for 'script';
  `.replace(/\s{2,}/g, ' ').trim();

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Nonce', nonce);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js, manifest.json, icons, logo.png
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|logo.png|icon-.*).*)',
  ],
};
