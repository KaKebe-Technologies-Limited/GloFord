/**
 * PaymentProvider: the small, stable interface every donation backend
 * implements. Swapping Stripe -> Adyen or adding a new country-specific
 * wallet means writing one file that conforms to this shape.
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
  campaignId?: string;
  recurring: boolean;
  /** Used by providers that want an idempotency key. */
  idempotencyKey?: string;
  /** Final return URL for wallet providers that need one. */
  returnUrl?: string;
};

export type CreateIntentResult = {
  /** The row in the DB `Donation` table is created with status=PENDING. */
  donationId: string;
  providerRef: string;
  /** Stripe-like SDKs need this on the client. */
  clientSecret?: string;
  /** PayPal returns a URL to redirect the donor to. */
  redirectUrl?: string;
  /** Public JSON payload passed to the DonateWidget client to complete. */
  publicPayload?: Record<string, unknown>;
};

export type WebhookVerifyResult = {
  eventId: string;
  type: string;
  /** Full event body, parsed. */
  event: unknown;
};

export interface PaymentProviderAdapter {
  readonly id: ProviderEnum;
  readonly label: string;

  createIntent(params: CreateIntentParams): Promise<CreateIntentResult>;

  /** Verifies signature and returns a normalized event. */
  verifyWebhook(req: Request, rawBody: string): Promise<WebhookVerifyResult>;

  /**
   * Map a verified provider event to a donation state transition.
   * Providers emit many event types; we translate to our internal enum.
   */
  interpretEvent(event: unknown): {
    providerRef: string;
    status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
    receiptUrl?: string;
    completedAt?: Date;
  } | null;
}
