"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createDonationIntent, refundDonation } from "@/lib/services/donations";
import { requireActorFromSession } from "@/lib/auth-context";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { rateLimit } from "@/lib/ratelimit";

/**
 * Public Server Action: create a donation intent. No auth required —
 * anyone on the donate page can call this. Abuse is mitigated by:
 *   • Zod validation of amount + currency.
 *   • Provider-side fraud screening (Stripe Radar).
 *   • IP-based rate limiting via `rateLimit`.
 */
export async function createDonationIntentAction(raw: unknown) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimit({
    bucket: "donate-intent",
    identifier: ip,
    limit: 10,
    windowSeconds: 600, // 10 attempts per 10 min per IP
  });
  if (!rl.ok) {
    throw new ValidationError(
      `Too many donation attempts. Try again after ${rl.resetAt.toLocaleTimeString()}.`,
    );
  }
  const org = await db.organization.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!org) throw new NotFoundError("Organization");
  return createDonationIntent(org.id, raw);
}

export async function refundDonationAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await refundDonation(actor, raw);
  revalidatePath("/admin/donations");
}
