import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * iCal/ICS feed for a single event.
 * GET /api/events/:slug/ical
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await db.event.findUnique({
    where: { slug },
    select: { id: true, title: true, description: true, startsAt: true, endsAt: true, location: true, isPublic: true },
  });

  if (!event || !event.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ics = buildIcs(event);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildIcs(event: {
  id: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
}) {
  const dtStart = formatIcsDate(event.startsAt);
  const dtEnd = event.endsAt
    ? formatIcsDate(event.endsAt)
    : formatIcsDate(new Date(event.startsAt.getTime() + 2 * 60 * 60 * 1000)); // default 2h

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gloford//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@gloford`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description.slice(0, 500))}`,
    ...(event.location ? [`LOCATION:${escapeIcs(event.location)}`] : []),
    `DTSTAMP:${formatIcsDate(new Date())}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
