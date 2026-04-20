import { UpstreamError } from "@/lib/errors";
import type { PaymentProviderAdapter } from "./types";

/**
 * PayPal stub (not currently on the enabled providers list).
 * Kept at interface-compliance so the registry can include it if you
 * decide to implement the Orders v2 REST flow later.
 */
export const paypalAdapter: PaymentProviderAdapter = {
  id: "PAYPAL",
  label: "PayPal",
  flow: "REDIRECT",

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
