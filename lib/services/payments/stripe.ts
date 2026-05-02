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

const STRIPE_API_VERSION = "2026-04-22.dahlia" as const;

let _stripe: Stripe | null = null;

async function getStripe(): Promise<{
  stripe: Stripe;
  cfg: Awaited<ReturnType<typeof loadConfig<"STRIPE">>>;
}> {
  const cfg = await loadConfig("STRIPE");
  if (!_stripe || (_stripe as unknown as { _api?: { auth?: string } })._api?.auth !== cfg.secrets.secretKey) {
    _stripe = new Stripe(cfg.secrets.secretKey, { apiVersion: STRIPE_API_VERSION });
  }
  return { stripe: _stripe, cfg };
}

export const stripeAdapter: PaymentProviderAdapter = {
  id: "STRIPE",
  label: "Card (Stripe)",
  flow: "REDIRECT",

  async createIntent(params: CreateIntentParams): Promise<CreateIntentResult> {
    const { stripe, cfg } = await getStripe();
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const returnUrl = params.returnUrl ?? `${origin}/donate/success`;
    const cancelUrl = `${origin}/donate/cancel`;
    const currency = (cfg.publicConfig.currency ?? params.currency ?? "USD").toLowerCase();

    // Upsert donor + create pending donation first so we have an ID
    const { donation } = await db.$transaction(async (tx) => {
      const donor = await tx.donor.upsert({
        where: { email: params.donorEmail },
        update: { name: params.donorName ?? undefined },
        create: { email: params.donorEmail, name: params.donorName },
      });
      const donation = await tx.donation.create({
        data: {
          donorId: donor.id,
          campaignId: params.campaignId,
          amountCents: params.amountCents,
          currency: currency.toUpperCase(),
          provider: "STRIPE",
          providerRef: `pending_${crypto.randomUUID()}`,
          type: params.recurring ? "RECURRING" : "ONE_TIME",
          status: "PENDING",
        },
      });
      return { donation };
    });

    const idempotencyOpts = params.idempotencyKey
      ? { idempotencyKey: params.idempotencyKey }
      : undefined;

    if (params.recurring) {
      const customer = await stripe.customers.create({
        email: params.donorEmail,
        name: params.donorName,
        metadata: { donationId: donation.id },
      });
      const session = await stripe.checkout.sessions.create(
        {
          mode: "subscription",
          customer: customer.id,
          line_items: [
            {
              price_data: {
                currency,
                unit_amount: params.amountCents,
                recurring: { interval: "month" },
                product_data: { name: "Monthly Donation" },
              },
              quantity: 1,
            },
          ],
          success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
          metadata: { donationId: donation.id },
        },
        idempotencyOpts,
      );
      await db.donation.update({
        where: { id: donation.id },
        data: { providerRef: session.id },
      });
      return {
        kind: "REDIRECT",
        donationId: donation.id,
        providerRef: session.id,
        redirectUrl: session.url!,
      };
    } else {
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency,
                unit_amount: params.amountCents,
                product_data: { name: "Donation" },
              },
              quantity: 1,
            },
          ],
          customer_email: params.donorEmail,
          success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
          metadata: { donationId: donation.id },
        },
        idempotencyOpts,
      );
      await db.donation.update({
        where: { id: donation.id },
        data: { providerRef: session.id },
      });
      return {
        kind: "REDIRECT",
        donationId: donation.id,
        providerRef: session.id,
        redirectUrl: session.url!,
      };
    }
  },

  async verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult> {
    const cfg = await loadConfig("STRIPE");
    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new ValidationError("Missing stripe-signature header");
    const stripe = new Stripe(cfg.secrets.secretKey, { apiVersion: STRIPE_API_VERSION });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, cfg.secrets.webhookSecret);
    } catch (e) {
      throw new UpstreamError(
        `Stripe webhook signature failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    return { eventId: event.id, type: event.type, event };
  },

  interpretEvent(raw) {
    const event = raw as Stripe.Event;
    const providerRef = (event.data.object as { id?: string }).id ?? "";

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          return {
            providerRef: session.id,
            status: "SUCCEEDED",
            completedAt: new Date(),
          };
        }
        return null;
      }
      case "checkout.session.expired":
        return { providerRef, status: "FAILED" };
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = charge.payment_intent;
        return {
          providerRef: typeof pi === "string" ? pi : (pi?.id ?? charge.id),
          status: "REFUNDED",
          completedAt: new Date(),
        };
      }
      default:
        return null;
    }
  },

  async refund({ providerRef, amountCents, reason }) {
    const { stripe } = await getStripe();
    try {
      const refund = await stripe.refunds.create({
        payment_intent: providerRef,
        ...(amountCents !== undefined && { amount: amountCents }),
        reason: (reason as Stripe.RefundCreateParams.Reason) ?? "requested_by_customer",
      });
      return { ok: refund.status === "succeeded", providerRefundId: refund.id };
    } catch (e) {
      throw new UpstreamError(
        `Stripe refund failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  },
};
