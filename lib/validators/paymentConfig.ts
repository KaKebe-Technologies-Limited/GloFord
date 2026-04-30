import { z } from "zod";

/**
 * Per-provider admin form schemas. The service uses the `provider`
 * discriminator to pick the right shape before encrypting.
 */

const modeSchema = z.enum(["sandbox", "live"]);

export const pesapalConfigSchema = z.object({
  provider: z.literal("PESAPAL"),
  isEnabled: z.boolean(),
  mode: modeSchema,
  consumerKey: z.string().trim().min(5),
  consumerSecret: z.string().trim().min(5),
  ipnId: z.string().trim().optional(),
  country: z.string().trim().length(2).optional(),
});

export const mtnMomoConfigSchema = z.object({
  provider: z.literal("MTN_MOMO"),
  isEnabled: z.boolean(),
  mode: modeSchema,
  subscriptionKey: z.string().trim().min(10),
  apiUser: z.string().trim().min(5),
  apiKey: z.string().trim().min(5),
  targetEnvironment: z.string().trim().optional(),
  currency: z.string().trim().length(3).optional(),
  callbackHost: z.string().trim().url().optional(),
});

export const airtelMoneyConfigSchema = z.object({
  provider: z.literal("AIRTEL_MONEY"),
  isEnabled: z.boolean(),
  mode: modeSchema,
  clientId: z.string().trim().min(5),
  clientSecret: z.string().trim().min(5),
  country: z.string().trim().length(2).optional(),
  currency: z.string().trim().length(3).optional(),
});

export const paymentConfigSchema = z.discriminatedUnion("provider", [
  pesapalConfigSchema,
  mtnMomoConfigSchema,
  airtelMoneyConfigSchema,
]);

export const toggleConfigSchema = z.object({
  provider: z.enum(["PESAPAL", "MTN_MOMO", "AIRTEL_MONEY"]),
  isEnabled: z.boolean(),
});

export type PaymentConfigInput = z.infer<typeof paymentConfigSchema>;
