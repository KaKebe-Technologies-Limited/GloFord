import { describe, it, expect } from "vitest";
import {
  pesapalConfigSchema,
  mtnMomoConfigSchema,
  airtelMoneyConfigSchema,
  paymentConfigSchema,
  toggleConfigSchema,
} from "@/lib/validators/paymentConfig";

describe("Payment config validators", () => {
  // ── Pesapal ──
  describe("pesapalConfigSchema", () => {
    const valid = {
      provider: "PESAPAL" as const,
      isEnabled: true,
      mode: "sandbox" as const,
      consumerKey: "pk_test_12345",
      consumerSecret: "sk_test_12345",
    };

    it("accepts valid Pesapal config", () => {
      expect(pesapalConfigSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects short consumer key", () => {
      expect(pesapalConfigSchema.safeParse({ ...valid, consumerKey: "abc" }).success).toBe(false);
    });

    it("rejects invalid mode", () => {
      expect(pesapalConfigSchema.safeParse({ ...valid, mode: "test" }).success).toBe(false);
    });

    it("accepts optional ipnId and country", () => {
      expect(pesapalConfigSchema.safeParse({ ...valid, ipnId: "ipn123", country: "UG" }).success).toBe(true);
    });

    it("rejects country not 2 chars", () => {
      expect(pesapalConfigSchema.safeParse({ ...valid, country: "UGA" }).success).toBe(false);
    });
  });

  // ── MTN MoMo ──
  describe("mtnMomoConfigSchema", () => {
    const valid = {
      provider: "MTN_MOMO" as const,
      isEnabled: false,
      mode: "sandbox" as const,
      subscriptionKey: "sub_key_12345",
      apiUser: "api_user_1",
      apiKey: "api_key_1",
    };

    it("accepts valid MTN config", () => {
      expect(mtnMomoConfigSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects short subscription key (< 10)", () => {
      expect(mtnMomoConfigSchema.safeParse({ ...valid, subscriptionKey: "short" }).success).toBe(false);
    });

    it("accepts optional currency (3 chars)", () => {
      expect(mtnMomoConfigSchema.safeParse({ ...valid, currency: "UGX" }).success).toBe(true);
    });

    it("rejects currency not 3 chars", () => {
      expect(mtnMomoConfigSchema.safeParse({ ...valid, currency: "UGXX" }).success).toBe(false);
    });
  });

  // ── Airtel Money ──
  describe("airtelMoneyConfigSchema", () => {
    const valid = {
      provider: "AIRTEL_MONEY" as const,
      isEnabled: true,
      mode: "live" as const,
      clientId: "client_12345",
      clientSecret: "secret_12345",
    };

    it("accepts valid Airtel config", () => {
      expect(airtelMoneyConfigSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects short clientId", () => {
      expect(airtelMoneyConfigSchema.safeParse({ ...valid, clientId: "abc" }).success).toBe(false);
    });
  });

  // ── Discriminated union ──
  describe("paymentConfigSchema (discriminated union)", () => {
    it("dispatches to Pesapal schema based on provider", () => {
      expect(
        paymentConfigSchema.safeParse({
          provider: "PESAPAL",
          isEnabled: true,
          mode: "sandbox",
          consumerKey: "12345",
          consumerSecret: "67890",
        }).success,
      ).toBe(true);
    });

    it("dispatches to MTN schema based on provider", () => {
      expect(
        paymentConfigSchema.safeParse({
          provider: "MTN_MOMO",
          isEnabled: false,
          mode: "sandbox",
          subscriptionKey: "1234567890",
          apiUser: "12345",
          apiKey: "12345",
        }).success,
      ).toBe(true);
    });

    it("rejects unknown provider", () => {
      expect(
        paymentConfigSchema.safeParse({
          provider: "STRIPE",
          isEnabled: true,
          mode: "live",
        }).success,
      ).toBe(false);
    });
  });

  // ── Toggle ──
  describe("toggleConfigSchema", () => {
    it("accepts valid toggle", () => {
      expect(toggleConfigSchema.safeParse({ provider: "PESAPAL", isEnabled: true }).success).toBe(true);
    });

    it("validates provider enum", () => {
      expect(toggleConfigSchema.safeParse({ provider: "STRIPE", isEnabled: true }).success).toBe(false);
    });
  });
});
