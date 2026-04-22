import type { PaymentProvider as ProviderEnum } from "@prisma/client";
import { runAsTenant } from "@/lib/tenant/context";
import type { PaymentProviderAdapter } from "./types";
import { stripeAdapter } from "./stripe";
import { paypalAdapter } from "./paypal";
import { pesapalAdapter } from "./pesapal";
import { flutterwaveAdapter } from "./flutterwave";
import { mtnMomoAdapter } from "./mtn-momo";
import { airtelMoneyAdapter } from "./airtel-money";

const ADAPTERS: Record<ProviderEnum, PaymentProviderAdapter> = {
  STRIPE: stripeAdapter,
  PAYPAL: paypalAdapter,
  MOBILE_MONEY: mtnMomoAdapter, // legacy alias
  PESAPAL: pesapalAdapter,
  FLUTTERWAVE: flutterwaveAdapter,
  MTN_MOMO: mtnMomoAdapter,
  AIRTEL_MONEY: airtelMoneyAdapter,
};

export function getAdapter(id: ProviderEnum): PaymentProviderAdapter {
  return ADAPTERS[id];
}

/** List providers the given org has enabled in its PaymentConfiguration. */
export async function listEnabledProviders(orgId: string) {
  const rows = await runAsTenant(orgId, (tx) =>
    tx.paymentConfiguration.findMany({
      where: { organizationId: orgId, isEnabled: true },
      select: { provider: true, mode: true, publicConfig: true },
    }),
  );
  return rows
    .filter((r) => r.provider !== "MOBILE_MONEY") // legacy
    .map((r) => {
      const a = ADAPTERS[r.provider];
      return {
        id: r.provider,
        label: a.label,
        flow: a.flow,
        mode: r.mode,
        publicConfig: r.publicConfig as Record<string, unknown>,
      };
    });
}

export const ALL_PROVIDERS: {
  id: ProviderEnum;
  label: string;
  flow: "REDIRECT" | "AWAIT_PHONE";
}[] = [
  { id: "STRIPE", label: stripeAdapter.label, flow: stripeAdapter.flow },
  { id: "PESAPAL", label: pesapalAdapter.label, flow: pesapalAdapter.flow },
  { id: "FLUTTERWAVE", label: flutterwaveAdapter.label, flow: flutterwaveAdapter.flow },
  { id: "MTN_MOMO", label: mtnMomoAdapter.label, flow: mtnMomoAdapter.flow },
  { id: "AIRTEL_MONEY", label: airtelMoneyAdapter.label, flow: airtelMoneyAdapter.flow },
];
