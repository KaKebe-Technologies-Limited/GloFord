import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests for the webhook processing pipeline.
 *
 * These tests validate the shared processWebhook logic and
 * applyDonationEvent state machine without hitting real providers.
 */

// Mock the database
const mockDb = {
  webhookEvent: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  donation: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  donor: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/inngest/client", () => ({ inngest: { send: vi.fn() } }));

// Import after mocks
const { applyDonationEvent } = await import("@/lib/services/donations");

describe("applyDonationEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("transitions PENDING → SUCCEEDED", async () => {
    const existing = {
      id: "don_1",
      status: "PENDING",
      donorId: "donor_1",
      amountCents: 5000,
      currency: "UGX",
    };
    mockDb.donation.findUnique.mockResolvedValue(existing);
    mockDb.donation.update.mockResolvedValue({ ...existing, status: "SUCCEEDED" });
    mockDb.donor.findUnique.mockResolvedValue({ id: "donor_1", email: "test@example.com" });

    const result = await applyDonationEvent({
      providerRef: "ref_123",
      status: "SUCCEEDED",
      completedAt: new Date(),
    });

    expect(mockDb.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "don_1" },
        data: expect.objectContaining({ status: "SUCCEEDED" }),
      }),
    );
    expect(result).toBeTruthy();
  });

  it("transitions PENDING → FAILED", async () => {
    const existing = {
      id: "don_2",
      status: "PENDING",
      donorId: null,
      amountCents: 1000,
      currency: "USD",
    };
    mockDb.donation.findUnique.mockResolvedValue(existing);
    mockDb.donation.update.mockResolvedValue({ ...existing, status: "FAILED" });

    const result = await applyDonationEvent({
      providerRef: "ref_456",
      status: "FAILED",
    });

    expect(mockDb.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
    expect(result).toBeTruthy();
  });

  it("is idempotent — same status returns existing without update", async () => {
    const existing = {
      id: "don_3",
      status: "SUCCEEDED",
      donorId: "donor_2",
      amountCents: 2000,
      currency: "UGX",
    };
    mockDb.donation.findUnique.mockResolvedValue(existing);

    const result = await applyDonationEvent({
      providerRef: "ref_789",
      status: "SUCCEEDED",
    });

    expect(mockDb.donation.update).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });

  it("does not transition REFUNDED → SUCCEEDED", async () => {
    const existing = {
      id: "don_4",
      status: "REFUNDED",
      donorId: "donor_3",
      amountCents: 3000,
      currency: "USD",
    };
    mockDb.donation.findUnique.mockResolvedValue(existing);

    const result = await applyDonationEvent({
      providerRef: "ref_000",
      status: "SUCCEEDED",
    });

    expect(mockDb.donation.update).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });

  it("returns null when donation not found", async () => {
    mockDb.donation.findUnique.mockResolvedValue(null);

    const result = await applyDonationEvent({
      providerRef: "ref_nonexistent",
      status: "SUCCEEDED",
    });

    expect(result).toBeNull();
  });
});
