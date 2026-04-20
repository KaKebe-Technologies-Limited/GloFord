import { UpstreamError } from "@/lib/errors";
import type { PaymentProviderAdapter } from "./types";

/**
 * PayPal adapter — stub.
 *
 * Full implementation uses the PayPal Orders v2 REST API directly
 * (the legacy @paypal/checkout-server-sdk is deprecated). Flow:
 *   1. POST /v2/checkout/orders to create an order -> approval URL.
 *   2. Donor approves at PayPal, lands back on our return URL.
 *   3. POST /v2/checkout/orders/{id}/capture to finalize.
 *   4. PayPal webhook (CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.*)
 *      confirms state.
 *
 * Left intentionally unimplemented here so Phase 3 ships behind a
 * Stripe-only surface. Flipping PAYPAL_CLIENT_ID into the env will
 * not break anything; the provider registry only lists adapters that
 * self-report as configured.
 */
export const paypalAdapter: PaymentProviderAdapter = {
  id: "PAYPAL",
  label: "PayPal",

  async createIntent() {
    throw new UpstreamError("PayPal provider is not yet implemented");
  },

  async verifyWebhook() {
    throw new UpstreamError("PayPal provider is not yet implemented");
  },

  interpretEvent() {
    return null;
  },
};

export function paypalIsConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}
