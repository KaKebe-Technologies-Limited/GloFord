import { describe, expect, it } from "vitest";
import { eventCreateSchema } from "@/lib/validators/events";
import { donationRefundSchema } from "@/lib/validators/donations";
import { featureFlagUpsertSchema } from "@/lib/validators/system";

describe("eventCreateSchema", () => {
  it("rejects endsAt < startsAt", () => {
    const result = eventCreateSchema.safeParse({
      slug: "spring-gala",
      title: "Spring Gala",
      description: "Our annual fundraiser",
      startsAt: new Date("2026-06-01T20:00:00Z"),
      endsAt: new Date("2026-06-01T19:00:00Z"),
    });
    expect(result.success).toBe(false);
  });

  it("accepts endsAt >= startsAt", () => {
    const result = eventCreateSchema.safeParse({
      slug: "spring-gala",
      title: "Spring Gala",
      description: "Our annual fundraiser",
      startsAt: new Date("2026-06-01T20:00:00Z"),
      endsAt: new Date("2026-06-01T22:00:00Z"),
    });
    expect(result.success).toBe(true);
  });

  it("requires a valid slug", () => {
    const result = eventCreateSchema.safeParse({
      slug: "Spring Gala",
      title: "Spring Gala",
      description: "x",
      startsAt: new Date(),
    });
    expect(result.success).toBe(false);
  });
});

describe("donationRefundSchema", () => {
  it("accepts id alone", () => {
    const out = donationRefundSchema.safeParse({ id: "cjld2cjxh0000qzrmn831i7rn" });
    expect(out.success).toBe(true);
  });

  it("rejects negative amounts", () => {
    const out = donationRefundSchema.safeParse({
      id: "cjld2cjxh0000qzrmn831i7rn",
      amountCents: -50,
    });
    expect(out.success).toBe(false);
  });
});

describe("featureFlagUpsertSchema", () => {
  it("rejects spaces in key", () => {
    const out = featureFlagUpsertSchema.safeParse({
      key: "bad key",
      isEnabled: true,
    });
    expect(out.success).toBe(false);
  });

  it("accepts dot-notation keys", () => {
    const out = featureFlagUpsertSchema.safeParse({
      key: "feature.newDashboard",
      isEnabled: true,
    });
    expect(out.success).toBe(true);
  });
});
