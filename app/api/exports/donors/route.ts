import { requireActorFromSession } from "@/lib/auth-context";
import { authorize } from "@/lib/rbac/authorize";
import { runAsTenant } from "@/lib/tenant/context";
import { toCsv, csvResponse } from "@/lib/services/exports/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireActorFromSession();
  await authorize(actor, "donors.export", { type: "Donor" });

  const donors = await runAsTenant(actor.orgId, (tx) =>
    tx.donor.findMany({
      where: { organizationId: actor.orgId },
      include: {
        donations: {
          where: { status: "SUCCEEDED" },
          select: { amountCents: true, currency: true, completedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  );

  const flat = donors.map((d) => {
    const total = d.donations.reduce((acc, x) => acc + x.amountCents, 0);
    const first = d.donations.at(-1)?.completedAt ?? null;
    const last = d.donations[0]?.completedAt ?? null;
    return {
      id: d.id,
      email: d.email,
      name: d.name ?? "",
      phone: d.phone ?? "",
      country: d.country ?? "",
      donationCount: d.donations.length,
      totalAmount: (total / 100).toFixed(2),
      currency: d.donations[0]?.currency ?? "",
      firstDonationAt: first,
      lastDonationAt: last,
      createdAt: d.createdAt,
    };
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(flat), `donors-${stamp}.csv`);
}

export async function POST() {
  return new Response("method not allowed", { status: 405 });
}
