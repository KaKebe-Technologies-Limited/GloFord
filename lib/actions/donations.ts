"use server";

import { db } from "@/lib/db";
import { createDonationIntent } from "@/lib/services/donations";
import { NotFoundError } from "@/lib/errors";

/**
 * Public Server Action: create a donation intent. No auth required —
 * anyone on the donate page can call this. Abuse is mitigated by:
 *   • Zod validation of amount + currency.
 *   • Provider-side fraud screening (Stripe Radar).
 *   • Rate-limiting to be added at the edge in Phase 7.
 */
export async function createDonationIntentAction(raw: unknown) {
  const org = await db.organization.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!org) throw new NotFoundError("Organization");
  return createDonationIntent(org.id, raw);
}
