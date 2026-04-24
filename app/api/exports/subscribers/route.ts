import { requireActorFromSession } from "@/lib/auth-context";
import { authorize } from "@/lib/rbac/authorize";
import { runAsTenant } from "@/lib/tenant/context";
import { toCsv, csvResponse } from "@/lib/services/exports/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireActorFromSession();
  await authorize(actor, "subscribers.export", { type: "Subscriber" });

  const rows = await runAsTenant((tx) =>
    tx.subscriber.findMany({
      where: {  },
      include: { segments: { include: { segment: { select: { slug: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  );

  const flat = rows.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name ?? "",
    status: s.status,
    source: s.source ?? "",
    confirmedAt: s.confirmedAt,
    createdAt: s.createdAt,
    segments: s.segments.map((x) => x.segment.slug).join("|"),
  }));

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(flat), `subscribers-${stamp}.csv`);
}
