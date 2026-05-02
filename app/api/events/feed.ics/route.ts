import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Full iCal feed of all upcoming public events.
 * GET /api/events/feed.ics
 * Subscribe in Google Calendar / Apple Calendar / Outlook.
 */
export async function GET() {
  const events = await db.event.findMany({
    where: { isPublic: true, startsAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true, description: true, startsAt: true, endsAt: true, location: true, slug: true },
    take: 100,
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gloford//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Gloford Events",
  ];

  for (const e of events) {
    const dtStart = formatIcsDate(e.startsAt);
    const dtEnd = e.endsAt
      ? formatIcsDate(e.endsAt)
      : formatIcsDate(new Date(e.startsAt.getTime() + 2 * 60 * 60 * 1000));

    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@gloford`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcs(e.title)}`,
      `DESCRIPTION:${escapeIcs(e.description.slice(0, 500))}`,
      ...(e.location ? [`LOCATION:${escapeIcs(e.location)}`] : []),
      `DTSTAMP:${formatIcsDate(new Date())}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
