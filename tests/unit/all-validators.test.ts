import { describe, it, expect } from "vitest";
import { cuid, slug, email, nonEmpty, paginationSchema } from "@/lib/validators/common";
import { pageCreateSchema, pageUpdateSchema, pagePublishSchema, pageDeleteSchema } from "@/lib/validators/pages";
import { campaignCreateSchema, campaignUpdateSchema, campaignDeleteSchema } from "@/lib/validators/campaigns";
import { navCreateSchema, navUpdateSchema, navDeleteSchema, navReorderSchema } from "@/lib/validators/nav";
import { subscribeSchema, subscriberUpdateSchema, subscriberDeleteSchema } from "@/lib/validators/subscribers";
import { newsletterCreateSchema, newsletterScheduleSchema } from "@/lib/validators/newsletters";
import { siteSettingsUpdateSchema } from "@/lib/validators/settings";
import { segmentCreateSchema, segmentDeleteSchema } from "@/lib/validators/segments";
import { userInviteSchema, userUpdateRoleSchema, userDeactivateSchema } from "@/lib/validators/users";
import {
  emailCampaignCreateSchema,
  emailCampaignActivateSchema,
  campaignEmailCreateSchema,
} from "@/lib/validators/emailCampaigns";

// ── Common ──
describe("common validators", () => {
  describe("cuid", () => {
    it("accepts valid cuid strings", () => {
      expect(cuid.safeParse("clq1234567890abcdefghij").success).toBe(true);
      expect(cuid.safeParse("abc12345678901234567890").success).toBe(true);
    });
    it("rejects empty", () => expect(cuid.safeParse("").success).toBe(false));
    it("rejects special chars", () => expect(cuid.safeParse("abc!@#$%^&*()").success).toBe(false));
  });

  describe("slug", () => {
    it("accepts valid slugs", () => {
      expect(slug.safeParse("my-page").success).toBe(true);
      expect(slug.safeParse("about").success).toBe(true);
      expect(slug.safeParse("page-123").success).toBe(true);
    });
    it("rejects uppercase", () => expect(slug.safeParse("My-Page").success).toBe(false));
    it("rejects spaces", () => expect(slug.safeParse("my page").success).toBe(false));
    it("rejects empty", () => expect(slug.safeParse("").success).toBe(false));
    it("rejects trailing hyphens", () => expect(slug.safeParse("page-").success).toBe(false));
  });

  describe("email", () => {
    it("accepts valid email", () => expect(email.safeParse("user@test.com").success).toBe(true));
    it("rejects invalid email", () => expect(email.safeParse("not-an-email").success).toBe(false));
  });

  describe("nonEmpty", () => {
    it("rejects empty string", () => expect(nonEmpty("X").safeParse("").success).toBe(false));
    it("rejects whitespace-only", () => expect(nonEmpty("X").safeParse("   ").success).toBe(false));
    it("accepts text", () => expect(nonEmpty("X").safeParse("hello").success).toBe(true));
  });

  describe("paginationSchema", () => {
    it("defaults page to 1 and pageSize to 20", () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
    it("coerces string numbers", () => {
      const result = paginationSchema.parse({ page: "3", pageSize: "50" });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(50);
    });
    it("rejects pageSize > 100", () => {
      expect(paginationSchema.safeParse({ pageSize: 101 }).success).toBe(false);
    });
    it("rejects page < 1", () => {
      expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false);
    });
  });
});

// ── Pages ──
describe("page validators", () => {
  it("accepts valid page create", () => {
    expect(pageCreateSchema.safeParse({ slug: "about-us", title: "About Us" }).success).toBe(true);
  });
  it("rejects page create without slug", () => {
    expect(pageCreateSchema.safeParse({ title: "About Us" }).success).toBe(false);
  });
  it("accepts partial update with id", () => {
    expect(pageUpdateSchema.safeParse({ id: "abc12345678901234567890", title: "New" }).success).toBe(true);
  });
  it("validates publish status enum", () => {
    expect(pagePublishSchema.safeParse({ id: "abc12345678901234567890", status: "PUBLISHED" }).success).toBe(true);
    expect(pagePublishSchema.safeParse({ id: "abc12345678901234567890", status: "INVALID" }).success).toBe(false);
  });
  it("validates page delete requires cuid", () => {
    expect(pageDeleteSchema.safeParse({ id: "abc12345678901234567890" }).success).toBe(true);
    expect(pageDeleteSchema.safeParse({ id: "" }).success).toBe(false);
  });
});

// ── Campaigns ──
describe("campaign validators", () => {
  const valid = { slug: "summer-2026", title: "Summer Drive", description: "Annual campaign" };

  it("accepts valid campaign", () => {
    expect(campaignCreateSchema.safeParse(valid).success).toBe(true);
  });
  it("defaults currency to USD", () => {
    expect(campaignCreateSchema.parse(valid).currency).toBe("USD");
  });
  it("defaults isActive to true", () => {
    expect(campaignCreateSchema.parse(valid).isActive).toBe(true);
  });
  it("rejects currency not 3 chars", () => {
    expect(campaignCreateSchema.safeParse({ ...valid, currency: "US" }).success).toBe(false);
  });
  it("accepts goalCents as positive int", () => {
    expect(campaignCreateSchema.safeParse({ ...valid, goalCents: 500000 }).success).toBe(true);
  });
  it("rejects negative goalCents", () => {
    expect(campaignCreateSchema.safeParse({ ...valid, goalCents: -1 }).success).toBe(false);
  });
  it("validates campaign update requires id", () => {
    expect(campaignUpdateSchema.safeParse({ title: "New" }).success).toBe(false);
    expect(campaignUpdateSchema.safeParse({ id: "abc12345678901234567890", title: "New" }).success).toBe(true);
  });
});

// ── Navigation ──
describe("nav validators", () => {
  it("accepts valid nav item", () => {
    expect(navCreateSchema.safeParse({ location: "HEADER", label: "Home" }).success).toBe(true);
  });
  it("rejects invalid location", () => {
    expect(navCreateSchema.safeParse({ location: "SIDEBAR", label: "X" }).success).toBe(false);
  });
  it("validates all 3 locations", () => {
    for (const loc of ["HEADER", "FOOTER", "ADMIN_SIDEBAR"]) {
      expect(navCreateSchema.safeParse({ location: loc, label: "X" }).success).toBe(true);
    }
  });
  it("validates reorder requires at least 1 item", () => {
    expect(navReorderSchema.safeParse({ items: [] }).success).toBe(false);
    expect(navReorderSchema.safeParse({ items: [{ id: "abc12345678901234567890", order: 0 }] }).success).toBe(true);
  });
});

// ── Subscribers ──
describe("subscriber validators", () => {
  it("accepts valid subscribe", () => {
    expect(subscribeSchema.safeParse({ email: "user@test.com" }).success).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(subscribeSchema.safeParse({ email: "not-email" }).success).toBe(false);
  });
  it("validates subscriber update status enum", () => {
    for (const s of ["PENDING", "ACTIVE", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED"]) {
      expect(subscriberUpdateSchema.safeParse({ id: "abc12345678901234567890", status: s }).success).toBe(true);
    }
  });
});

// ── Newsletters ──
describe("newsletter validators", () => {
  it("accepts valid newsletter", () => {
    expect(newsletterCreateSchema.safeParse({ title: "Weekly Update", subject: "This Week" }).success).toBe(true);
  });
  it("rejects empty subject", () => {
    expect(newsletterCreateSchema.safeParse({ title: "X", subject: "" }).success).toBe(false);
  });
  it("validates schedule with date", () => {
    expect(newsletterScheduleSchema.safeParse({ id: "abc12345678901234567890", scheduledAt: "2026-06-01" }).success).toBe(true);
  });
  it("validates schedule with null (unschedule)", () => {
    expect(newsletterScheduleSchema.safeParse({ id: "abc12345678901234567890", scheduledAt: null }).success).toBe(true);
  });
});

// ── Settings ──
describe("settings validators", () => {
  it("accepts valid settings", () => {
    expect(siteSettingsUpdateSchema.safeParse({ siteName: "Gloford" }).success).toBe(true);
  });
  it("rejects empty siteName", () => {
    expect(siteSettingsUpdateSchema.safeParse({ siteName: "" }).success).toBe(false);
  });
  it("validates foundingYear range", () => {
    expect(siteSettingsUpdateSchema.safeParse({ siteName: "X", foundingYear: 1899 }).success).toBe(false);
    expect(siteSettingsUpdateSchema.safeParse({ siteName: "X", foundingYear: 2101 }).success).toBe(false);
    expect(siteSettingsUpdateSchema.safeParse({ siteName: "X", foundingYear: 2017 }).success).toBe(true);
  });
  it("validates nested contact object", () => {
    const result = siteSettingsUpdateSchema.parse({
      siteName: "Gloford",
      contact: { email: "info@gloford.org", phone: "+256700000000" },
    });
    expect(result.contact.email).toBe("info@gloford.org");
  });
  it("rejects invalid contact email", () => {
    expect(
      siteSettingsUpdateSchema.safeParse({ siteName: "X", contact: { email: "not-an-email" } }).success,
    ).toBe(false);
  });
});

// ── Segments ──
describe("segment validators", () => {
  it("accepts valid segment", () => {
    expect(segmentCreateSchema.safeParse({ slug: "donors", name: "Donors" }).success).toBe(true);
  });
  it("rejects empty name", () => {
    expect(segmentCreateSchema.safeParse({ slug: "x", name: "" }).success).toBe(false);
  });
});

// ── Users ──
describe("user validators", () => {
  it("accepts valid invite", () => {
    expect(userInviteSchema.safeParse({ email: "new@test.com", role: "EDITOR" }).success).toBe(true);
  });
  it("rejects invalid role", () => {
    expect(userInviteSchema.safeParse({ email: "x@y.com", role: "SUPER_ADMIN" }).success).toBe(false);
  });
  it("validates role update", () => {
    expect(userUpdateRoleSchema.safeParse({ userId: "abc12345678901234567890", role: "VIEWER" }).success).toBe(true);
  });
  it("validates deactivation", () => {
    expect(userDeactivateSchema.safeParse({ userId: "abc12345678901234567890" }).success).toBe(true);
  });
});

// ── Email Campaigns ──
describe("email campaign validators", () => {
  it("accepts valid email campaign", () => {
    expect(emailCampaignCreateSchema.safeParse({ name: "Welcome", trigger: "ON_SIGNUP" }).success).toBe(true);
  });
  it("validates all trigger types", () => {
    for (const t of ["ON_SIGNUP", "ON_DONATION", "SCHEDULED", "MANUAL"]) {
      expect(emailCampaignCreateSchema.safeParse({ name: "X", trigger: t }).success).toBe(true);
    }
  });
  it("rejects invalid trigger", () => {
    expect(emailCampaignCreateSchema.safeParse({ name: "X", trigger: "INVALID" }).success).toBe(false);
  });
  it("validates activate schema", () => {
    expect(emailCampaignActivateSchema.safeParse({ id: "abc12345678901234567890", isActive: true }).success).toBe(true);
  });
  it("validates campaign email create", () => {
    expect(
      campaignEmailCreateSchema.safeParse({
        campaignId: "abc12345678901234567890",
        stepOrder: 1,
        subject: "Welcome!",
      }).success,
    ).toBe(true);
  });
  it("rejects negative stepOrder", () => {
    expect(
      campaignEmailCreateSchema.safeParse({
        campaignId: "abc12345678901234567890",
        stepOrder: -1,
        subject: "X",
      }).success,
    ).toBe(false);
  });
  it("defaults delayMinutes to 0", () => {
    const result = campaignEmailCreateSchema.parse({
      campaignId: "abc12345678901234567890",
      stepOrder: 0,
      subject: "X",
    });
    expect(result.delayMinutes).toBe(0);
  });
});
