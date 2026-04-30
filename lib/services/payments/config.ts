import type { PaymentProvider as ProviderEnum } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptJson } from "@/lib/crypto/encrypt";

/**
 * Typed config shapes per provider. A provider's adapter calls
 * `loadConfig(provider)` to get a fully-resolved, decrypted view;
 * loadConfig refuses to return if the provider is disabled.
 */

export type PesapalSecrets = { consumerKey: string; consumerSecret: string };
export type PesapalPublic = { callbackUrl?: string; ipnId?: string; country?: string };

export type MtnMomoSecrets = {
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
};
export type MtnMomoPublic = { targetEnvironment?: string; currency?: string; callbackHost?: string };

export type AirtelMoneySecrets = { clientId: string; clientSecret: string };
export type AirtelMoneyPublic = { country?: string; currency?: string };

export type ProviderConfig<P extends ProviderEnum> = P extends "PESAPAL"
  ? { secrets: PesapalSecrets; publicConfig: PesapalPublic; mode: string }
  : P extends "MTN_MOMO"
    ? { secrets: MtnMomoSecrets; publicConfig: MtnMomoPublic; mode: string }
    : P extends "AIRTEL_MONEY"
      ? { secrets: AirtelMoneySecrets; publicConfig: AirtelMoneyPublic; mode: string }
      : never;

export async function loadConfig<P extends ProviderEnum>(
  provider: P,
): Promise<ProviderConfig<P>> {
  const row = await db.paymentConfiguration.findUnique({ where: { provider } });
  if (!row) throw new Error(`Provider ${provider} is not configured`);
  if (!row.isEnabled) throw new Error(`Provider ${provider} is disabled`);
  if (!row.encryptedSecrets) throw new Error(`Provider ${provider} is missing secrets`);

  const secrets = decryptJson(row.encryptedSecrets);
  return {
    secrets,
    publicConfig: (row.publicConfig ?? {}) as Record<string, unknown>,
    mode: row.mode,
  } as ProviderConfig<P>;
}

export async function listConfigs() {
  return db.paymentConfiguration.findMany({
    orderBy: { provider: "asc" },
    select: {
      id: true,
      provider: true,
      isEnabled: true,
      mode: true,
      publicConfig: true,
      lastVerifiedAt: true,
      verifyError: true,
      updatedAt: true,
    },
  });
}
