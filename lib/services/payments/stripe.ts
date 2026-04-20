import Stripe from "stripe";
import { db } from "@/lib/db";
import { UpstreamError, ValidationError } from "@/lib/errors";
import type {
  CreateIntentParams,
  CreateIntentResult,
  PaymentProviderAdapter,
  WebhookVerifyResult,
} from "./types";

let cached: Stripe | null = null;
function client() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new UpstreamError("Stripe is not configured");
  if (!cached) cached = new Stripe(key, { apiVersion: "2024-12-18.acacia" });
  return cached;
}

export const stripeAdapter: PaymentProviderAdapter = {
  id: "STRIPE",
  label: "Card (Stripe)",

  async createIntent(params: CreateIntentParams): Promise<CreateIntentResult> {
    const stripe = client();

    // Upsert donor by (org, email).
    const donor = await db.donor.upsert({
      where: {
        organizationId_email: { organizationId: params.orgId, email: params.donorEmail },
      },
      update: { name: params.donorName ?? undefined },
      create: {
        organizationId: params.orgId,
        email: params.donorEmail,
        name: params.donorName,
      },
    });

    // Use Stripe Checkout Sessions: Stripe hosts the card form, handles
    // 3DS, wallet buttons, etc. The donor returns to our success/cancel
    // URL; the webhook is the source of truth for status.
    //
    // Recurring donations use mode=subscription with a dynamic price.
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const baseMetadata = {
      orgId: params.orgId,
      donorId: donor.id,
      campaignId: params.campaignId ?? "",
      recurring: params.recurring ? "1" : "0",
    };

    const session = await stripe.checkout.sessions.create(
      {
        mode: params.recurring ? "subscription" : "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: params.currency.toLowerCase(),
              unit_amount: params.amountCents,
              product_data: {
                name: params.campaignId ? "Donation (campaign)" : "Donation",
              },
              ...(params.recurring ? { recurring: { interval: "month" } } : {}),
            },
          },
        ],
        customer_email: params.donorEmail,
        success_url: `${origin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/donate/cancel`,
        metadata: baseMetadata,
        payment_intent_data: params.recurring ? undefined : { metadata: baseMetadata },
        subscription_data: params.recurring ? { metadata: baseMetadata } : undefined,
      },
      params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined,
    );

    if (!session.url) {
      throw new UpstreamError("Stripe did not return a checkout URL");
    }

    // providerRef is the PaymentIntent id for one-time donations, and
    // the Subscription id for recurring. The Session id is stored in
    // metadata for debugging.
    const providerRef =
      (typeof session.payment_intent === "string" ? session.payment_intent : null) ??
      (typeof session.subscription === "string" ? session.subscription : null) ??
      session.id;

    const donation = await db.donation.create({
      data: {
        organizationId: params.orgId,
        donorId: donor.id,
        campaignId: params.campaignId,
        amountCents: params.amountCents,
        currency: params.currency.toUpperCase(),
        provider: "STRIPE",
        providerRef,
        type: params.recurring ? "RECURRING" : "ONE_TIME",
        status: "PENDING",
        metadata: { checkoutSessionId: session.id } as never,
      },
    });

    return {
      donationId: donation.id,
      providerRef,
      redirectUrl: session.url,
    };
  },

  async verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult> {
    const sig = req.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !secret) throw new ValidationError("Missing Stripe webhook signature or secret");
    let event: Stripe.Event;
    try {
      event = client().webhooks.constructEvent(rawBody, sig, secret);
    } catch (e) {
      throw new ValidationError("Invalid Stripe signature", e);
    }
    return { eventId: event.id, type: event.type, event };
  },

  interpretEvent(raw) {
    const event = raw as Stripe.Event;
    switch (event.type) {
      case "checkout.session.completed": {
        // Covers both mode=payment (payment_intent present) and
        // mode=subscription (subscription present). SUCCEEDED is the
        // correct terminal state only for one-time; subscriptions will
        // emit invoice.paid / invoice.payment_failed over their life.
        const s = event.data.object as Stripe.Checkout.Session;
        const providerRef =
          (typeof s.payment_intent === "string" ? s.payment_intent : null) ??
          (typeof s.subscription === "string" ? s.subscription : null) ??
          s.id;
        return { providerRef, status: "SUCCEEDED", completedAt: new Date(event.created * 1000) };
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        return {
          providerRef: pi.id,
          status: "SUCCEEDED",
          completedAt: new Date(pi.created * 1000),
          receiptUrl:
            typeof pi.latest_charge === "string"
              ? undefined
              : (pi.latest_charge as Stripe.Charge | null)?.receipt_url ?? undefined,
        };
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        return { providerRef: pi.id, status: "FAILED" };
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        if (!inv.subscription) return null;
        const ref = typeof inv.subscription === "string" ? inv.subscription : inv.subscription.id;
        return {
          providerRef: ref,
          status: "SUCCEEDED",
          completedAt: new Date(event.created * 1000),
          receiptUrl: inv.hosted_invoice_url ?? undefined,
        };
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (!charge.payment_intent) return null;
        const ref =
          typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent.id;
        return { providerRef: ref, status: "REFUNDED" };
      }
      default:
        return null;
    }
  },
};
