import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Auth guard for /admin. The layout also checks auth (defense in
 * depth) but middleware lets us redirect without rendering.
 *
 * RBAC is enforced at the service layer — the middleware only
 * verifies "is authenticated", never "is authorized for this action".
 */
export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAdmin = nextUrl.pathname.startsWith("/admin");
  if (!isAdmin) return;
  if (!session?.user?.id) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("next", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
