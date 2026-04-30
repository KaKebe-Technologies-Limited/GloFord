import type { z } from "zod";
import { createService } from "@/lib/services/_shared";
import { encryptJson } from "@/lib/crypto/encrypt";
import { paymentConfigSchema, toggleConfigSchema } from "@/lib/validators/paymentConfig";

type PaymentConfigInput = z.infer<typeof paymentConfigSchema>;

function splitConfig(input: PaymentConfigInput) {
  switch (input.provider) {
    case "PESAPAL":
      return {
        publicConfig: { ipnId: input.ipnId, country: input.country },
        secrets: { consumerKey: input.consumerKey, consumerSecret: input.consumerSecret },
      };
    case "MTN_MOMO":
      return {
        publicConfig: {
          targetEnvironment: input.targetEnvironment,
          currency: input.currency,
          callbackHost: input.callbackHost,
        },
        secrets: {
          subscriptionKey: input.subscriptionKey,
          apiUser: input.apiUser,
          apiKey: input.apiKey,
        },
      };
    case "AIRTEL_MONEY":
      return {
        publicConfig: { country: input.country, currency: input.currency },
        secrets: { clientId: input.clientId, clientSecret: input.clientSecret },
      };
  }
}

export const savePaymentConfig = createService({
  module: "settings",
  action: "update",
  schema: paymentConfigSchema,
  permission: () => ({ type: "Settings" }),
  loadBefore: async ({ input, tx }) =>
    tx.paymentConfiguration.findUnique({ where: { provider: input.provider } }),
  exec: async ({ input, tx }) => {
    const { publicConfig, secrets } = splitConfig(input);
    const encryptedSecrets = encryptJson(secrets);

    return tx.paymentConfiguration.upsert({
      where: { provider: input.provider },
      update: {
        isEnabled: input.isEnabled,
        mode: input.mode,
        publicConfig: publicConfig as never,
        encryptedSecrets,
        verifyError: null,
      },
      create: {
        provider: input.provider,
        isEnabled: input.isEnabled,
        mode: input.mode,
        publicConfig: publicConfig as never,
        encryptedSecrets,
      },
    });
  },
  version: (out) => ({ entityType: "PaymentConfiguration", entityId: out.id }),
});

export const togglePaymentProvider = createService({
  module: "settings",
  action: "update",
  schema: toggleConfigSchema,
  permission: () => ({ type: "Settings" }),
  exec: async ({ input, tx }) => {
    const existing = await tx.paymentConfiguration.findUnique({
      where: { provider: input.provider },
    });
    if (!existing) throw new Error("Configure keys before enabling this provider");
    if (input.isEnabled && !existing.encryptedSecrets) {
      throw new Error("Configure keys before enabling this provider");
    }
    return tx.paymentConfiguration.update({
      where: { provider: input.provider },
      data: { isEnabled: input.isEnabled },
    });
  },
});
