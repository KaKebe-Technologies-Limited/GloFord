/**
 * PaymentProvider: the small, stable interface every donation backend
 * implements. Swapping Stripe -> Adyen or adding a new country-specific
 * wallet means writing one file that conforms to this shape.
 *
 * The DonateWidget handles two UX shapes, both declared here:
 *   • REDIRECT  — Stripe, Pesapal, Flutterwave: browser navigates to
 *                 a hosted checkout URL, returns to our success page.
 *   • AWAIT_PHONE — MTN MoMo, Airtel Money: the donor authorizes on
 *                 their phone; we poll /api/donations/[id]/status
 *                 until the webhook flips it to SUCCEEDED or FAILED.
 */

import type { PaymentProvider as ProviderEnum } from "@prisma/client";

export type MoneyInput = {
  amountCents: number;
  currency: string;
};

export type CreateIntentParams = MoneyInput & {
  orgId: string;
  donorEmail: string;
  donorName?: string;
  /** Required for phone-authorized providers (MoMo/Airtel). */
  donorPhone?: string;
  campaignId?: string;
  recurring: boolean;
  idempotencyKey?: string;
  returnUrl?: string;
};

export type CreateIntentResult = {
  donationId: string;
  providerRef: string;
} & (
  | {
      kind: "REDIRECT";
      /** Browser navigates here to complete payment. */
      redirectUrl: string;
    }
  | {
      kind: "AWAIT_PHONE";
      /** Phone the donor authorized against, echoed back for UI. */
      phone: string;
    }
);

export type WebhookVerifyResult = {
  eventId: string;
  type: string;
  event: unknown;
};

export type DonationTransition = {
  providerRef: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  receiptUrl?: string;
  completedAt?: Date;
};

export interface PaymentProviderAdapter {
  readonly id: ProviderEnum;
  readonly label: string;
  /** REDIRECT adapters need no donor phone; AWAIT_PHONE adapters require it. */
  readonly flow: "REDIRECT" | "AWAIT_PHONE";

  createIntent(params: CreateIntentParams): Promise<CreateIntentResult>;

  verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult>;

  interpretEvent(event: unknown): DonationTransition | null;
}
