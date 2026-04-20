import type { PaymentProvider as ProviderEnum } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptJson } from "@/lib/crypto/encrypt";

/**
 * Typed config shapes per provider. A provider's adapter calls
 * `loadConfig(orgId, provider)` to get a fully-resolved, decrypted
 * view; loadConfig refuses to return if the provider is disabled.
 */

export type StripeSecrets = { secretKey: string; publishableKey?: string };
export type StripePublic = { webhookEndpointSecretRef?: string };

export type PayPalSecrets = { clientId: string; clientSecret: string };
export type PayPalPublic = Record<string, never>;

export type PesapalSecrets = { consumerKey: string; consumerSecret: string };
export type PesapalPublic = { callbackUrl?: string; ipnId?: string; country?: string };

export type FlutterwaveSecrets = { secretKey: string; publicKey: string };
export type FlutterwavePublic = { country?: string };

export type MtnMomoSecrets = {
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
};
export type MtnMomoPublic = { targetEnvironment?: string; currency?: string; callbackHost?: string };

export type AirtelMoneySecrets = { clientId: string; clientSecret: string };
export type AirtelMoneyPublic = { country?: string; currency?: string };

export type ProviderConfig<P extends ProviderEnum> = P extends "STRIPE"
  ? { secrets: StripeSecrets; publicConfig: StripePublic; mode: string }
  : P extends "PAYPAL"
    ? { secrets: PayPalSecrets; publicConfig: PayPalPublic; mode: string }
    : P extends "PESAPAL"
      ? { secrets: PesapalSecrets; publicConfig: PesapalPublic; mode: string }
      : P extends "FLUTTERWAVE"
        ? { secrets: FlutterwaveSecrets; publicConfig: FlutterwavePublic; mode: string }
        : P extends "MTN_MOMO"
          ? { secrets: MtnMomoSecrets; publicConfig: MtnMomoPublic; mode: string }
          : P extends "AIRTEL_MONEY"
            ? { secrets: AirtelMoneySecrets; publicConfig: AirtelMoneyPublic; mode: string }
            : never;

export async function loadConfig<P extends ProviderEnum>(
  orgId: string,
  provider: P,
): Promise<ProviderConfig<P>> {
  const row = await db.paymentConfiguration.findUnique({
    where: { organizationId_provider: { organizationId: orgId, provider } },
  });
  if (!row) throw new Error(`Provider ${provider} is not configured for this organization`);
  if (!row.isEnabled) throw new Error(`Provider ${provider} is disabled`);
  if (!row.encryptedSecrets) throw new Error(`Provider ${provider} is missing secrets`);

  const secrets = decryptJson(row.encryptedSecrets);
  return {
    secrets,
    publicConfig: (row.publicConfig ?? {}) as Record<string, unknown>,
    mode: row.mode,
  } as ProviderConfig<P>;
}

/** Used by the admin UI to show provider status without decrypting secrets. */
export async function listConfigs(orgId: string) {
  return db.paymentConfiguration.findMany({
    where: { organizationId: orgId },
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
