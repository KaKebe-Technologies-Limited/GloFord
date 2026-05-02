import { NextResponse } from "next/server";
import { requireActorFromSession } from "@/lib/auth-context";
import { getEventRegistrations } from "@/lib/services/events/registration";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  await requireActorFromSession();

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { title: true, slug: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const registrations = await getEventRegistrations(eventId);

  const header = "Name,Email,Status,Registered At\n";
  const rows = registrations.map((r) =>
    [
      csvEscape(r.name ?? ""),
      csvEscape(r.email),
      r.status,
      new Date(r.registeredAt).toISOString(),
    ].join(","),
  );

  const csv = header + rows.join("\n");
  const filename = `attendees-${event.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
