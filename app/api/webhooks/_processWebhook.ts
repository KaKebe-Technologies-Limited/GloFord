import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAppError } from "@/lib/errors";
import type { PaymentProvider } from "@prisma/client";
import type { PaymentProviderAdapter } from "@/lib/services/payments/types";
import { applyDonationEvent } from "@/lib/services/donations";

/**
 * Shared webhook pipeline for all providers:
 *   1. Verify signature via the adapter.
 *   2. Upsert WebhookEvent(provider, providerEventId). If already
 *      processed, reply 200 without repeating work.
 *   3. Interpret the event -> DonationTransition.
 *   4. Apply the transition.
 *   5. Mark WebhookEvent processed.
 *
 * If any step fails, error is stored on WebhookEvent and the provider
 * receives a 500 (triggering their retry). Idempotency is guaranteed
 * by the unique (provider, providerEventId) constraint.
 */
export async function processWebhook(
  req: Request,
  provider: PaymentProvider,
  adapter: PaymentProviderAdapter,
  hooks?: {
    /** Optional extra step after interpretEvent — e.g. Pesapal calls
     *  GetTransactionStatus here because its IPN doesn't include state. */
    enrich?: (verified: Awaited<ReturnType<PaymentProviderAdapter["verifyWebhook"]>>) => Promise<
      Parameters<typeof applyDonationEvent>[0] | null
    >;
  },
) {
  const raw = await req.text();

  let verified;
  try {
    verified = await adapter.verifyWebhook(req, raw);
  } catch (e) {
    const status = isAppError(e) ? e.status : 400;
    return NextResponse.json({ error: "invalid_signature" }, { status });
  }

  const existing = await db.webhookEvent.findUnique({
    where: { provider_providerEventId: { provider, providerEventId: verified.eventId } },
    select: { id: true, processedAt: true },
  });

  if (existing?.processedAt) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const record = existing
    ? existing
    : await db.webhookEvent.create({
        data: {
          provider,
          providerEventId: verified.eventId,
          eventType: verified.type,
          payload: verified.event as never,
        },
        select: { id: true, processedAt: true },
      });

  try {
    const transition = hooks?.enrich
      ? await hooks.enrich(verified)
      : adapter.interpretEvent(verified.event);
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
