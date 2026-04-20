import { createService } from "@/lib/services/_shared";
import { encryptJson } from "@/lib/crypto/encrypt";
import { paymentConfigSchema, toggleConfigSchema } from "@/lib/validators/paymentConfig";

/**
 * Split the typed input into (publicConfig, secretsObject) for storage.
 * Secrets are encrypted with AES-GCM before they touch the DB.
 */
function splitConfig(input: Parameters<typeof paymentConfigSchema.parse>[0]) {
  switch (input.provider) {
    case "STRIPE":
      return {
        publicConfig: {},
        secrets: { secretKey: input.secretKey, publishableKey: input.publishableKey },
      };
    case "PESAPAL":
      return {
        publicConfig: { ipnId: input.ipnId, country: input.country },
        secrets: { consumerKey: input.consumerKey, consumerSecret: input.consumerSecret },
      };
    case "FLUTTERWAVE":
      return {
        publicConfig: { country: input.country },
        secrets: { secretKey: input.secretKey, publicKey: input.publicKey },
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
  loadBefore: async ({ input, tx, actor }) =>
    tx.paymentConfiguration.findUnique({
      where: { organizationId_provider: { organizationId: actor.orgId, provider: input.provider } },
    }),
  exec: async ({ input, actor, tx }) => {
    const { publicConfig, secrets } = splitConfig(input);
    const encryptedSecrets = encryptJson(secrets);

    const row = await tx.paymentConfiguration.upsert({
      where: {
        organizationId_provider: { organizationId: actor.orgId, provider: input.provider },
      },
      update: {
        isEnabled: input.isEnabled,
        mode: input.mode,
        publicConfig: publicConfig as never,
        encryptedSecrets,
        verifyError: null,
      },
      create: {
        organizationId: actor.orgId,
        provider: input.provider,
        isEnabled: input.isEnabled,
        mode: input.mode,
        publicConfig: publicConfig as never,
        encryptedSecrets,
      },
    });
    return row;
  },
  version: (out) => ({ entityType: "PaymentConfiguration", entityId: out.id }),
});

export const togglePaymentProvider = createService({
  module: "settings",
  action: "update",
  schema: toggleConfigSchema,
  permission: () => ({ type: "Settings" }),
  exec: async ({ input, actor, tx }) => {
    const existing = await tx.paymentConfiguration.findUnique({
      where: { organizationId_provider: { organizationId: actor.orgId, provider: input.provider } },
    });
    if (!existing) {
      throw new Error("Configure keys before enabling this provider");
    }
    if (input.isEnabled && !existing.encryptedSecrets) {
      throw new Error("Configure keys before enabling this provider");
    }
    return tx.paymentConfiguration.update({
      where: {
        organizationId_provider: { organizationId: actor.orgId, provider: input.provider },
      },
      data: { isEnabled: input.isEnabled },
    });
  },
});
