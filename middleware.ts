import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware does two things:
 *
 *   1. Stamp a correlation ID (`x-correlation-id`) onto every request
 *      and echo it back in the response. Server actions / route handlers
 *      read this header and attach it to AuditLog.correlationId so you
 *      can trace a multi-event transaction end-to-end.
 *
 *   2. Guard /admin by requiring a session cookie. This is presence-only;
 *      real RBAC happens in the admin layout + every service call. Keeps
 *      middleware pure cookie-inspection so it stays at the edge without
 *      dragging Prisma into the edge bundle.
 */

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export const CORRELATION_HEADER = "x-correlation-id";

function newCorrelationId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    // Fallback for older Node runtimes where Web Crypto isn't available.
    `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  );
}

export function middleware(req: NextRequest) {
  // Resilience: if anything in this function throws, Next will treat
  // it as a 500 middleware error and the user sees a black page. Wrap
  // the whole body in try/catch and fall through to NextResponse.next
  // on any unexpected failure. The correlation-ID and auth guard
  // features are best-effort by design.
  try {
    const { pathname } = req.nextUrl;
    const cid = req.headers.get(CORRELATION_HEADER) ?? newCorrelationId();

    // Mirror it onto the request so downstream server code reads one value.
    const forwardedHeaders = new Headers(req.headers);
    forwardedHeaders.set(CORRELATION_HEADER, cid);

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
    return res;
  } catch {
    // Never 500 from middleware. Route handlers still have their own
    // auth checks + runtime errors will be caught downstream.
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
