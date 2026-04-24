"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createDonationIntent, refundDonation } from "@/lib/services/donations";
import { requireActorFromSession } from "@/lib/auth-context";
import { ValidationError } from "@/lib/errors";
import { rateLimit } from "@/lib/ratelimit";

/**
 * Public Server Action: create a donation intent. No auth required —
 * anyone on the donate page can call this. Abuse is mitigated by:
 *   • Zod validation of amount + currency.
 *   • Provider-side fraud screening.
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
    windowSeconds: 600,
  });
  if (!rl.ok) {
    throw new ValidationError(
      `Too many donation attempts. Try again after ${rl.resetAt.toLocaleTimeString()}.`,
    );
  }
  return createDonationIntent(raw);
}

export async function refundDonationAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await refundDonation(actor, raw);
  revalidatePath("/admin/donations");
}
