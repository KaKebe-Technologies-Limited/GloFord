/**
 * PaymentProvider: the small, stable interface every donation backend
 * implements.
 *
 * Two UX shapes:
 *   • REDIRECT  — Stripe, Pesapal, Flutterwave: browser navigates to a
 *                 hosted checkout URL, returns to our success page.
 *   • AWAIT_PHONE — MTN MoMo, Airtel Money: the donor authorizes on
 *                 their phone; we poll /api/donations/[id]/status until
 *                 the webhook flips it to SUCCEEDED or FAILED.
 */

import type { PaymentProvider as ProviderEnum } from "@prisma/client";

export type MoneyInput = {
  amountCents: number;
  currency: string;
};

export type CreateIntentParams = MoneyInput & {
  donorEmail: string;
  donorName?: string;
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
  | { kind: "REDIRECT"; redirectUrl: string }
  | { kind: "AWAIT_PHONE"; phone: string }
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
  readonly flow: "REDIRECT" | "AWAIT_PHONE";

  createIntent(params: CreateIntentParams): Promise<CreateIntentResult>;
  verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult>;
  interpretEvent(event: unknown): DonationTransition | null;

  refund?(params: {
    providerRef: string;
    amountCents?: number;
    reason?: string;
  }): Promise<{ ok: boolean; providerRefundId?: string }>;
}
