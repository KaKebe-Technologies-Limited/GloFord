import Stripe from "stripe";
import { db } from "@/lib/db";
import { UpstreamError, ValidationError } from "@/lib/errors";
import { loadConfig } from "./config";
import type {
  CreateIntentParams,
  CreateIntentResult,
  PaymentProviderAdapter,
  WebhookVerifyResult,
} from "./types";

async function stripeClient() {
  const cfg = await loadConfig("STRIPE");
  return new Stripe(cfg.secrets.secretKey, { apiVersion: "2025-02-24.acacia" });
}

export const stripeAdapter: PaymentProviderAdapter = {
  id: "STRIPE",
  label: "Card (Stripe)",
  flow: "REDIRECT",

  async createIntent(params: CreateIntentParams): Promise<CreateIntentResult> {
    const stripe = await stripeClient();

    const donor = await db.donor.upsert({
      where: { email: params.donorEmail },
      update: { name: params.donorName ?? undefined },
      create: { email: params.donorEmail, name: params.donorName },
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const baseMetadata = {
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
              product_data: { name: params.campaignId ? "Donation (campaign)" : "Donation" },
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

    if (!session.url) throw new UpstreamError("Stripe did not return a checkout URL");

    const providerRef =
      (typeof session.payment_intent === "string" ? session.payment_intent : null) ??
      (typeof session.subscription === "string" ? session.subscription : null) ??
      session.id;

    const donation = await db.donation.create({
      data: {
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
      kind: "REDIRECT",
      donationId: donation.id,
      providerRef,
      redirectUrl: session.url,
    };
  },

  async verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult> {
    const sig = req.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !secret) throw new ValidationError("Missing Stripe webhook signature or secret");
    const stripe = await stripeClient();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (e) {
      throw new ValidationError("Invalid Stripe signature", e);
    }
    return { eventId: event.id, type: event.type, event };
  },

  async refund({ providerRef, amountCents, reason }) {
    const stripe = await stripeClient();
    const refund = await stripe.refunds.create({
      payment_intent: providerRef,
      ...(amountCents !== undefined && { amount: amountCents }),
      ...(reason && { reason: "requested_by_customer" as const }),
      metadata: { reason: reason ?? "" },
    });
    return {
      ok: refund.status === "succeeded" || refund.status === "pending",
      providerRefundId: refund.id,
    };
  },

  interpretEvent(raw) {
    const event = raw as Stripe.Event;
    switch (event.type) {
      case "checkout.session.completed": {
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
