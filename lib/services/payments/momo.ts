import { UpstreamError } from "@/lib/errors";
import type { PaymentProviderAdapter } from "./types";

/**
 * Mobile Money adapter — stub.
 *
 * MoMo (MTN, Airtel, M-Pesa) APIs vary by country and provider.
 * Implementation plan:
 *   1. Request-to-pay: POST /collection/v1_0/requesttopay with
 *      {amount, currency, payer.partyId=<msisdn>}.
 *   2. Provider returns a pending transaction id.
 *   3. Donor authorizes on their phone.
 *   4. We poll GET /requesttopay/{referenceId} OR wait for webhook.
 *
 * Deferred until MoMo becomes a ship-blocking requirement.
 */
export const momoAdapter: PaymentProviderAdapter = {
  id: "MOBILE_MONEY",
  label: "Mobile Money",

  async createIntent() {
    throw new UpstreamError("Mobile Money provider is not yet implemented");
  },

  async verifyWebhook() {
    throw new UpstreamError("Mobile Money provider is not yet implemented");
  },

  interpretEvent() {
    return null;
  },
};

export function momoIsConfigured(): boolean {
  return !!(
    process.env.MOMO_API_USER &&
    process.env.MOMO_API_KEY &&
    process.env.MOMO_SUBSCRIPTION_KEY
  );
}
