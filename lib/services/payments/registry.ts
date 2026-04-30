import type { PaymentProvider as ProviderEnum } from "@prisma/client";
import { db } from "@/lib/db";
import type { PaymentProviderAdapter } from "./types";
import { pesapalAdapter } from "./pesapal";
import { mtnMomoAdapter } from "./mtn-momo";
import { airtelMoneyAdapter } from "./airtel-money";

const ADAPTERS: Record<ProviderEnum, PaymentProviderAdapter> = {
  PESAPAL: pesapalAdapter,
  MTN_MOMO: mtnMomoAdapter,
  AIRTEL_MONEY: airtelMoneyAdapter,
};

export function getAdapter(id: ProviderEnum): PaymentProviderAdapter {
  return ADAPTERS[id];
}

export async function listEnabledProviders() {
  const rows = await db.paymentConfiguration.findMany({
    where: { isEnabled: true },
    select: { provider: true, mode: true, publicConfig: true },
  });
  return rows.map((r) => {
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
  { id: "PESAPAL", label: pesapalAdapter.label, flow: pesapalAdapter.flow },
  { id: "MTN_MOMO", label: mtnMomoAdapter.label, flow: mtnMomoAdapter.flow },
  { id: "AIRTEL_MONEY", label: airtelMoneyAdapter.label, flow: airtelMoneyAdapter.flow },
];
