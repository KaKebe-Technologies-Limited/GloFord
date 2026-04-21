import { NextRequest, NextResponse } from "next/server";

/**
 * Edge-safe auth guard for /admin.
 *
 * We only check session-cookie presence here; the admin layout + every
 * service call perform the real RBAC checks. This file stays pure
 * cookie-inspection so it can run at the edge without dragging Prisma
 * or Auth.js into the middleware bundle.
 */

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  const hasSession = SESSION_COOKIES.some((name) => req.cookies.get(name));
  if (hasSession) return NextResponse.next();
  const url = new URL("/login", req.url);
  url.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
