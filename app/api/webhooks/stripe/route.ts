import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAppError } from "@/lib/errors";
import { stripeAdapter } from "@/lib/services/payments/stripe";
import { applyDonationEvent } from "@/lib/services/donations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stripe webhook.
 *
 * Idempotency contract:
 *   1. Verify signature.
 *   2. Upsert a WebhookEvent row keyed by (provider, providerEventId).
 *      If it already has processedAt, return 200 without processing.
 *   3. Apply the state transition to the Donation.
 *   4. Mark WebhookEvent processed.
 *
 * Stripe may retry the same event; this contract guarantees
 * at-least-once delivery becomes effectively-once processing.
 */
export async function POST(req: Request) {
  const raw = await req.text();

  let verified;
  try {
    verified = await stripeAdapter.verifyWebhook(req, raw);
  } catch (e) {
    const status = isAppError(e) ? e.status : 400;
    return NextResponse.json({ error: "invalid_signature" }, { status });
  }

  // Dedupe.
  const existing = await db.webhookEvent.findUnique({
    where: { provider_providerEventId: { provider: "STRIPE", providerEventId: verified.eventId } },
    select: { id: true, processedAt: true },
  });

  if (existing?.processedAt) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const record = existing
    ? existing
    : await db.webhookEvent.create({
        data: {
          provider: "STRIPE",
          providerEventId: verified.eventId,
          eventType: verified.type,
          payload: verified.event as never,
        },
        select: { id: true, processedAt: true },
      });

  // Interpret + apply. If the event isn't one we care about, still mark
  // processed so Stripe stops retrying.
  try {
    const transition = stripeAdapter.interpretEvent(verified.event);
    if (transition) await applyDonationEvent(transition);

    await db.webhookEvent.update({
      where: { id: record.id },
      data: { processedAt: new Date(), error: null },
    });
    return NextResponse.json({ received: true });
  } catch (e) {
    await db.webhookEvent.update({
      where: { id: record.id },
      data: { error: e instanceof Error ? e.message : String(e) },
    });
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
