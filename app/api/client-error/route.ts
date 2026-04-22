import { NextResponse } from "next/server";
import { captureException } from "@/lib/observability/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Minimal client-error sink. The client-side GlobalError boundary posts
 * here so crashes on the browser side land in the same observability
 * pipeline as server-side exceptions. The payload is trusted only as
 * far as the report — we never execute it.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      message?: string;
      digest?: string;
      stack?: string;
    };
    captureException(new Error(body.message ?? "client-error"), {
      source: "client",
      digest: body.digest,
      stack: body.stack,
      url: req.headers.get("referer") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
  } catch {
    /* swallow — client-error reporting must never error */
  }
  return NextResponse.json({ ok: true });
}
