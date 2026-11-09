import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Sliding-window IP Rate Limiter store for Edge Runtime
interface IpRateRecord {
  count: number;
  resetAt: number;
}

const edgeRateLimitMap = new Map<string, IpRateRecord>();

// Blocked automated attack tools & malicious vulnerability scanners
const BLOCKED_BOT_REGEX =
  /(sqlmap|nikto|nmap|masscan|wpscan|gobuster|dirbuster|acunetix|nessus|zgrab|morfeus|fuzzdb)/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

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

  // 2. IP / Session Rate Limiting on API Endpoints
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

  // 3. Attach Enterprise Security Headers
  const response = NextResponse.next();

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

