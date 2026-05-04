import { NextRequest, NextResponse } from "next/server";
import { COUNTRY_LOCALE_MAP, defaultLocale } from "@/lib/i18n/config";

const LOCALE_COOKIE = "gloford_locale";

/**
 * Edge middleware:
 *   1. Stamp a correlation ID (`x-correlation-id`) for tracing
 *   2. Generate a CSP nonce per request for XSS protection
 *   3. Guard /admin by requiring a session cookie
 *   4. Auto-detect locale from geo-IP on first visit
 */

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export const CORRELATION_HEADER = "x-correlation-id";
export const CSP_NONCE_HEADER = "x-csp-nonce";

function newCorrelationId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  );
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;
    const cid = req.headers.get(CORRELATION_HEADER) ?? newCorrelationId();
    const nonce = generateNonce();

    const forwardedHeaders = new Headers(req.headers);
    forwardedHeaders.set(CORRELATION_HEADER, cid);
    forwardedHeaders.set(CSP_NONCE_HEADER, nonce);

    if (pathname.startsWith("/admin")) {
      const hasSession = SESSION_COOKIES.some((name) => req.cookies.get(name));
      if (!hasSession) {
        const url = new URL("/login", req.url);
        url.searchParams.set("next", pathname + req.nextUrl.search);
        const res = NextResponse.redirect(url);
        res.headers.set(CORRELATION_HEADER, cid);
        return res;
      }
    }

    const res = NextResponse.next({ request: { headers: forwardedHeaders } });
    res.headers.set(CORRELATION_HEADER, cid);
    res.headers.set("Content-Security-Policy", buildCsp(nonce));

    // Auto-detect locale from geo-IP on first visit (no cookie yet)
    if (!req.cookies.get(LOCALE_COOKIE)) {
      const country =
        req.headers.get("cf-ipcountry") ??            // Cloudflare
        req.headers.get("x-vercel-ip-country") ??     // Vercel
        (req as unknown as { geo?: { country?: string } }).geo?.country ??
        null;
      const detected = country
        ? COUNTRY_LOCALE_MAP[country.toUpperCase()] ?? defaultLocale
        : defaultLocale;
      res.cookies.set(LOCALE_COOKIE, detected, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return res;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // All admin routes for auth guard, plus the rest of the app for
    // correlation-ID propagation. Static assets are excluded.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
