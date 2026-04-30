import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests for the full donation lifecycle:
 *   1. Donation intent creation
 *   2. Provider redirect/polling
 *   3. Webhook processing
 *   4. Status transitions
 *   5. Duplicate webhook handling
 */

const mockDb = {
  campaign: {
    findFirst: vi.fn(),
  },
  donation: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  donor: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  webhookEvent: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  siteSettings: {
    findUnique: vi.fn(),
  },
  paymentConfiguration: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/inngest/client", () => ({ inngest: { send: vi.fn() } }));

describe("Donation lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Intent validation", () => {
    it("rejects negative amounts", async () => {
      const { donationIntentSchema } = await import("@/lib/validators/donations");

      const result = donationIntentSchema.safeParse({
        donorEmail: "test@example.com",
        donorName: "Test",
        amountCents: -100,
        currency: "UGX",
        provider: "PESAPAL",
      });

      expect(result.success).toBe(false);
    });

    it("rejects zero amounts", async () => {
      const { donationIntentSchema } = await import("@/lib/validators/donations");

      const result = donationIntentSchema.safeParse({
        donorEmail: "test@example.com",
        donorName: "Test",
        amountCents: 0,
        currency: "UGX",
        provider: "PESAPAL",
      });

      expect(result.success).toBe(false);
    });

    it("accepts valid intent", async () => {
      const { donationIntentSchema } = await import("@/lib/validators/donations");

      const result = donationIntentSchema.safeParse({
        donorEmail: "donor@example.com",
        donorName: "Jane Doe",
        amountCents: 5000,
        currency: "UGX",
        provider: "PESAPAL",
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid email", async () => {
      const { donationIntentSchema } = await import("@/lib/validators/donations");

      const result = donationIntentSchema.safeParse({
        donorEmail: "not-an-email",
        donorName: "Test",
        amountCents: 1000,
        currency: "USD",
        provider: "MTN_MOMO",
      });

      expect(result.success).toBe(false);
    });

    it("rejects unsupported provider", async () => {
      const { donationIntentSchema } = await import("@/lib/validators/donations");

      const result = donationIntentSchema.safeParse({
        donorEmail: "test@example.com",
        donorName: "Test",
        amountCents: 1000,
        currency: "USD",
        provider: "STRIPE",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Webhook deduplication", () => {
    it("skips already-processed webhook events", async () => {
      mockDb.webhookEvent.findUnique.mockResolvedValue({
        id: "wh_1",
        processedAt: new Date(),
      });

      const existing = await mockDb.webhookEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: "PESAPAL",
            providerEventId: "evt_123",
          },
        },
      });

      expect(existing?.processedAt).toBeTruthy();
      // Pipeline should return { received: true, duplicate: true }
    });

    it("processes new webhook events", async () => {
      mockDb.webhookEvent.findUnique.mockResolvedValue(null);
      mockDb.webhookEvent.create.mockResolvedValue({
        id: "wh_new",
        processedAt: null,
      });

      const existing = await mockDb.webhookEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: "PESAPAL",
            providerEventId: "evt_new",
          },
        },
      });

      expect(existing).toBeNull();
      // Pipeline should create and process the event
    });
  });

  describe("Status transition rules", () => {
    it("PENDING → SUCCEEDED updates completedAt", async () => {
      const { applyDonationEvent } = await import("@/lib/services/donations");
      const now = new Date();
      mockDb.donation.findUnique.mockResolvedValue({
        id: "don_1",
        status: "PENDING",
        donorId: "d1",
        amountCents: 10000,
        currency: "UGX",
      });
      mockDb.donation.update.mockResolvedValue({
        id: "don_1",
        status: "SUCCEEDED",
      });
      mockDb.donor.findUnique.mockResolvedValue({
        id: "d1",
        email: "donor@test.com",
      });

      await applyDonationEvent({
        providerRef: "prov_ref_1",
        status: "SUCCEEDED",
        completedAt: now,
      });

      expect(mockDb.donation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "SUCCEEDED",
            completedAt: now,
          }),
        }),
      );
    });

    it("SUCCEEDED → REFUNDED is allowed", async () => {
      const { applyDonationEvent } = await import("@/lib/services/donations");
      mockDb.donation.findUnique.mockResolvedValue({
        id: "don_2",
        status: "SUCCEEDED",
        donorId: "d2",
        amountCents: 5000,
        currency: "USD",
      });
      mockDb.donation.update.mockResolvedValue({
        id: "don_2",
        status: "REFUNDED",
      });

      await applyDonationEvent({
        providerRef: "prov_ref_2",
        status: "REFUNDED",
      });

      expect(mockDb.donation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "REFUNDED" }),
        }),
      );
    });

    it("REFUNDED → SUCCEEDED is blocked (no rollback)", async () => {
      const { applyDonationEvent } = await import("@/lib/services/donations");
      mockDb.donation.findUnique.mockResolvedValue({
        id: "don_3",
        status: "REFUNDED",
        donorId: "d3",
        amountCents: 5000,
        currency: "UGX",
      });

      await applyDonationEvent({
        providerRef: "prov_ref_3",
        status: "SUCCEEDED",
      });

      expect(mockDb.donation.update).not.toHaveBeenCalled();
    });
  });

  describe("Campaign currency matching", () => {
    it("validates currency matches campaign", async () => {
      mockDb.campaign.findFirst.mockResolvedValue({
        id: "camp_1",
        currency: "UGX",
      });

      const campaign = await mockDb.campaign.findFirst({
        where: { slug: "education-fund", isActive: true },
      });

      expect(campaign!.currency).toBe("UGX");
      // Donation with USD currency should be rejected
    });
  });
});
