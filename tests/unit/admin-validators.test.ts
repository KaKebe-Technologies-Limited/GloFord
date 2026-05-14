import { describe, it, expect } from "vitest";
import {
  createCareerSchema,
  updateCareerSchema,
  createFaqSchema,
  createHeroSlideSchema,
  createTestimonialSchema,
  createLeaderMessageSchema,
  createMilestoneSchema,
  createServiceAreaSchema,
  createSiteStatSchema,
  upsertSiteImageSchema,
  createVolunteerSchema,
  upsertTranslationSchema,
  updatePartnerAppStatusSchema,
  updateCareerAppStatusSchema,
  toggleSchema,
  deleteSchema,
  parseFormData,
} from "@/lib/validators/admin";

describe("Admin validators", () => {
  // ── parseFormData ──
  describe("parseFormData", () => {
    it("extracts FormData entries into object and parses", () => {
      const fd = new FormData();
      fd.set("id", "abc12345678901234567890");
      const result = parseFormData(deleteSchema, fd);
      expect(result.id).toBe("abc12345678901234567890");
    });

    it("throws on invalid data", () => {
      const fd = new FormData();
      fd.set("id", "!invalid!");
      expect(() => parseFormData(deleteSchema, fd)).toThrow();
    });
  });

  // ── Careers ──
  describe("createCareerSchema", () => {
    const valid = {
      title: "Software Engineer",
      department: "Engineering",
      location: "Nairobi",
      description: "Build things",
    };

    it("accepts valid career data", () => {
      expect(createCareerSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects empty title", () => {
      expect(createCareerSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
    });

    it("rejects empty department", () => {
      expect(createCareerSchema.safeParse({ ...valid, department: "" }).success).toBe(false);
    });

    it("defaults type to FULL_TIME", () => {
      const result = createCareerSchema.parse(valid);
      expect(result.type).toBe("FULL_TIME");
    });

    it("accepts valid job types", () => {
      for (const t of ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "VOLUNTEER"]) {
        expect(createCareerSchema.safeParse({ ...valid, type: t }).success).toBe(true);
      }
    });

    it("parses text lists from newline-separated strings", () => {
      const result = createCareerSchema.parse({
        ...valid,
        requirements: "req1\nreq2\nreq3",
      });
      expect(result.requirements).toEqual(["req1", "req2", "req3"]);
    });

    it("filters empty lines from text lists", () => {
      const result = createCareerSchema.parse({
        ...valid,
        requirements: "req1\n\n\nreq2",
      });
      expect(result.requirements).toEqual(["req1", "req2"]);
    });

    it("transforms applicationDeadline string to Date", () => {
      const result = createCareerSchema.parse({
        ...valid,
        applicationDeadline: "2026-12-31",
      });
      expect(result.applicationDeadline).toBeInstanceOf(Date);
    });
  });

  describe("updateCareerSchema", () => {
    it("requires id field", () => {
      expect(
        updateCareerSchema.safeParse({ title: "X", department: "Y", location: "Z", description: "D" }).success,
      ).toBe(false);
    });

    it("parses isActive from string 'on'", () => {
      const result = updateCareerSchema.parse({
        id: "abc12345678901234567890",
        title: "X",
        department: "Y",
        location: "Z",
        description: "D",
        isActive: "on",
      });
      expect(result.isActive).toBe(true);
    });
  });

  // ── FAQs ──
  describe("createFaqSchema", () => {
    it("accepts valid FAQ", () => {
      expect(createFaqSchema.safeParse({ question: "Why?", answer: "Because." }).success).toBe(true);
    });

    it("rejects empty question", () => {
      expect(createFaqSchema.safeParse({ question: "", answer: "x" }).success).toBe(false);
    });

    it("defaults category to general", () => {
      const result = createFaqSchema.parse({ question: "Q?", answer: "A." });
      expect(result.category).toBe("general");
    });

    it("defaults order to 0", () => {
      const result = createFaqSchema.parse({ question: "Q?", answer: "A." });
      expect(result.order).toBe(0);
    });
  });

  // ── Hero Slides ──
  describe("createHeroSlideSchema", () => {
    it("accepts valid hero slide", () => {
      expect(
        createHeroSlideSchema.safeParse({ title: "Welcome", imageUrl: "https://img.test/a.jpg" }).success,
      ).toBe(true);
    });

    it("rejects missing imageUrl", () => {
      expect(createHeroSlideSchema.safeParse({ title: "Welcome" }).success).toBe(false);
    });

    it("clamps durationSeconds to 1-30", () => {
      expect(createHeroSlideSchema.safeParse({ title: "X", imageUrl: "x", durationSeconds: 0 }).success).toBe(false);
      expect(createHeroSlideSchema.safeParse({ title: "X", imageUrl: "x", durationSeconds: 31 }).success).toBe(false);
      expect(createHeroSlideSchema.parse({ title: "X", imageUrl: "x", durationSeconds: 15 }).durationSeconds).toBe(15);
    });

    it("defaults durationSeconds to 5", () => {
      const result = createHeroSlideSchema.parse({ title: "X", imageUrl: "img" });
      expect(result.durationSeconds).toBe(5);
    });
  });

  // ── Testimonials ──
  describe("createTestimonialSchema", () => {
    it("requires quote of at least 10 characters", () => {
      expect(createTestimonialSchema.safeParse({ quote: "short", authorName: "A" }).success).toBe(false);
      expect(
        createTestimonialSchema.safeParse({ quote: "This is long enough", authorName: "A" }).success,
      ).toBe(true);
    });

    it("clamps rating to 1-5", () => {
      expect(createTestimonialSchema.safeParse({ quote: "A long quote here", authorName: "A", rating: 0 }).success).toBe(false);
      expect(createTestimonialSchema.safeParse({ quote: "A long quote here", authorName: "A", rating: 6 }).success).toBe(false);
      expect(createTestimonialSchema.parse({ quote: "A long quote here", authorName: "A", rating: 3 }).rating).toBe(3);
    });

    it("defaults rating to 5", () => {
      const result = createTestimonialSchema.parse({ quote: "A long quote here", authorName: "A" });
      expect(result.rating).toBe(5);
    });
  });

  // ── Leader Messages ──
  describe("createLeaderMessageSchema", () => {
    it("accepts valid leader message", () => {
      expect(
        createLeaderMessageSchema.safeParse({
          leaderName: "John",
          title: "CEO",
          role: "Chief Executive",
          message: "Hello world",
        }).success,
      ).toBe(true);
    });

    it("rejects empty message", () => {
      expect(
        createLeaderMessageSchema.safeParse({
          leaderName: "John",
          title: "CEO",
          role: "Chief",
          message: "",
        }).success,
      ).toBe(false);
    });
  });

  // ── Milestones ──
  describe("createMilestoneSchema", () => {
    it("validates year is 4 digits", () => {
      expect(createMilestoneSchema.safeParse({ year: "2024", title: "X", description: "Y" }).success).toBe(true);
      expect(createMilestoneSchema.safeParse({ year: "24", title: "X", description: "Y" }).success).toBe(false);
      expect(createMilestoneSchema.safeParse({ year: "abcd", title: "X", description: "Y" }).success).toBe(false);
    });
  });

  // ── Service Areas ──
  describe("createServiceAreaSchema", () => {
    it("defaults icon to BookOpen", () => {
      const result = createServiceAreaSchema.parse({ title: "Education", description: "We teach" });
      expect(result.icon).toBe("BookOpen");
    });

    it("defaults color to blue gradient", () => {
      const result = createServiceAreaSchema.parse({ title: "Education", description: "We teach" });
      expect(result.color).toContain("blue");
    });
  });

  // ── Site Stats ──
  describe("createSiteStatSchema", () => {
    it("accepts valid stat", () => {
      expect(createSiteStatSchema.safeParse({ label: "Lives", value: "1,200+" }).success).toBe(true);
    });

    it("rejects empty label", () => {
      expect(createSiteStatSchema.safeParse({ label: "", value: "100" }).success).toBe(false);
    });
  });

  // ── Site Images ──
  describe("upsertSiteImageSchema", () => {
    it("validates key format (lowercase with hyphens)", () => {
      expect(upsertSiteImageSchema.safeParse({ key: "hero-image", label: "Hero", url: "x" }).success).toBe(true);
      expect(upsertSiteImageSchema.safeParse({ key: "INVALID", label: "X", url: "x" }).success).toBe(false);
      expect(upsertSiteImageSchema.safeParse({ key: "has spaces", label: "X", url: "x" }).success).toBe(false);
    });
  });

  // ── Volunteer ──
  describe("createVolunteerSchema", () => {
    it("accepts valid volunteer opportunity", () => {
      expect(
        createVolunteerSchema.safeParse({
          title: "Teaching",
          department: "Education",
          location: "Kampala",
          commitment: "4 hours/week",
          description: "Help kids learn",
        }).success,
      ).toBe(true);
    });

    it("rejects missing commitment", () => {
      expect(
        createVolunteerSchema.safeParse({
          title: "Teaching",
          department: "Education",
          location: "Kampala",
          description: "Help kids learn",
        }).success,
      ).toBe(false);
    });
  });

  // ── Translations ──
  describe("upsertTranslationSchema", () => {
    it("accepts valid translation", () => {
      expect(upsertTranslationSchema.safeParse({ locale: "en", key: "home.title", value: "Welcome" }).success).toBe(true);
    });

    it("rejects empty value", () => {
      expect(upsertTranslationSchema.safeParse({ locale: "en", key: "x", value: "" }).success).toBe(false);
    });

    it("rejects short locale", () => {
      expect(upsertTranslationSchema.safeParse({ locale: "e", key: "x", value: "y" }).success).toBe(false);
    });
  });

  // ── Status updates ──
  describe("updatePartnerAppStatusSchema", () => {
    it("accepts valid statuses", () => {
      for (const s of ["PENDING", "APPROVED", "REJECTED"]) {
        expect(updatePartnerAppStatusSchema.safeParse({ id: "abc12345678901234567890", status: s }).success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      expect(updatePartnerAppStatusSchema.safeParse({ id: "abc12345678901234567890", status: "INVALID" }).success).toBe(false);
    });
  });

  describe("updateCareerAppStatusSchema", () => {
    it("accepts all 7 career statuses", () => {
      for (const s of ["SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"]) {
        expect(updateCareerAppStatusSchema.safeParse({ id: "abc12345678901234567890", status: s }).success).toBe(true);
      }
    });
  });

  // ── Shared schemas ──
  describe("toggleSchema", () => {
    it("transforms string 'true' to boolean true", () => {
      const result = toggleSchema.parse({ id: "abc12345678901234567890", isActive: "true" });
      expect(result.isActive).toBe(true);
    });

    it("transforms string 'false' to boolean false", () => {
      const result = toggleSchema.parse({ id: "abc12345678901234567890", isActive: "false" });
      expect(result.isActive).toBe(false);
    });
  });

  describe("deleteSchema", () => {
    it("validates cuid format", () => {
      expect(deleteSchema.safeParse({ id: "abc12345678901234567890" }).success).toBe(true);
      expect(deleteSchema.safeParse({ id: "" }).success).toBe(false);
      expect(deleteSchema.safeParse({ id: "!!!" }).success).toBe(false);
    });
  });
});
