import type { PaymentProvider as ProviderEnum } from "@prisma/client";
import type { PaymentProviderAdapter } from "./types";
import { stripeAdapter } from "./stripe";
import { paypalAdapter, paypalIsConfigured } from "./paypal";
import { momoAdapter, momoIsConfigured } from "./momo";

const ADAPTERS: Record<ProviderEnum, PaymentProviderAdapter> = {
  STRIPE: stripeAdapter,
  PAYPAL: paypalAdapter,
  MOBILE_MONEY: momoAdapter,
};

export function getAdapter(id: ProviderEnum): PaymentProviderAdapter {
  return ADAPTERS[id];
}

export function listAvailableProviders(): { id: ProviderEnum; label: string; ready: boolean }[] {
  return [
    { id: "STRIPE", label: stripeAdapter.label, ready: !!process.env.STRIPE_SECRET_KEY },
    { id: "PAYPAL", label: paypalAdapter.label, ready: paypalIsConfigured() && false }, // stub
    { id: "MOBILE_MONEY", label: momoAdapter.label, ready: momoIsConfigured() && false }, // stub
  ];
}
