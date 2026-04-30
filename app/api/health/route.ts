import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "healthy",
        db: "connected",
        uptime: process.uptime(),
        latencyMs: Date.now() - start,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        db: "disconnected",
        latencyMs: Date.now() - start,
      },
      { status: 503 },
    );
  }
}
