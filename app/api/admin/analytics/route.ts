import { NextResponse } from "next/server";
import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics
 * Returns daily aggregates for the last 30 days:
 * - donations: { date, count, totalCents }
 * - subscribers: { date, count }
 */
export async function GET() {
  await requireActorFromSession();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  since.setHours(0, 0, 0, 0);

  const [donationRows, subscriberRows] = await Promise.all([
    db.$queryRaw<Array<{ day: string; count: bigint; total_cents: bigint }>>`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM-DD') AS day,
        COUNT(*)::bigint AS count,
        COALESCE(SUM("amountCents"), 0)::bigint AS total_cents
      FROM "Donation"
      WHERE "status" = 'SUCCEEDED' AND "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day
    `,
    db.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM-DD') AS day,
        COUNT(*)::bigint AS count
      FROM "Subscriber"
      WHERE "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day
    `,
  ]);

  // Fill in missing days with zeros
  const days: string[] = [];
  const cursor = new Date(since);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  while (cursor <= today) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  const donationMap = new Map(
    donationRows.map((r) => [r.day, { count: Number(r.count), totalCents: Number(r.total_cents) }]),
  );
  const subscriberMap = new Map(
    subscriberRows.map((r) => [r.day, Number(r.count)]),
  );

  const donations = days.map((d) => ({
    date: d,
    count: donationMap.get(d)?.count ?? 0,
    totalCents: donationMap.get(d)?.totalCents ?? 0,
  }));

  const subscribers = days.map((d) => ({
    date: d,
    count: subscriberMap.get(d) ?? 0,
  }));

  return NextResponse.json({ donations, subscribers });
}
