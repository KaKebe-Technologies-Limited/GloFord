import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const images = await db.media.findMany({
    where: { mime: { startsWith: "image/" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, alt: true },
  });
  return NextResponse.json(images);
}
