import { z } from "zod";
import { cuid, slug, nonEmpty } from "./common";

// ── Shared helpers ──────────────────────────────────────────

const order = z.coerce.number().int().min(0).default(0);
const optionalUrl = z.string().url().max(2048).or(z.literal("")).transform((v) => v || null).nullable().optional();
const optionalString = (label: string) =>
  z.string().max(500).transform((v) => v.trim() || null).nullable().optional().default("");

function parseFormData<T extends z.ZodTypeAny>(schema: T, fd: FormData): z.infer<T> {
  const raw: Record<string, unknown> = {};
  for (const [key, val] of fd.entries()) {
    raw[key] = typeof val === "string" ? val : val;
  }
  return schema.parse(raw);
}

export { parseFormData };

// ── Careers ──────────────────────────────────────────────────

const jobType = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "VOLUNTEER"]).default("FULL_TIME");

const textList = z
  .string()
  .transform((v) =>
    v
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string()));

export const createCareerSchema = z.object({
  title: nonEmpty("Title"),
  department: nonEmpty("Department"),
  location: nonEmpty("Location"),
  type: jobType.or(z.literal("").transform(() => "FULL_TIME" as const)).default("FULL_TIME"),
  description: nonEmpty("Description"),
  salaryRange: optionalString("Salary range"),
  applicationDeadline: z
    .string()
    .transform((v) => (v ? new Date(v) : null))
    .nullable()
    .optional()
    .default(""),
  requirements: textList.optional().default(""),
  responsibilities: textList.optional().default(""),
});

export const updateCareerSchema = createCareerSchema.extend({
  id: cuid,
  isActive: z
    .string()
    .transform((v) => v === "on" || v === "true")
    .optional()
    .default("false"),
});

// ── FAQs ─────────────────────────────────────────────────────

export const createFaqSchema = z.object({
  question: nonEmpty("Question"),
  answer: nonEmpty("Answer"),
  category: z.string().max(100).optional().default("general"),
  order,
});

export const updateFaqSchema = createFaqSchema.extend({
  id: cuid,
  isActive: z.string().transform((v) => v === "on" || v === "true").optional().default("false"),
});

// ── Hero Slides ──────────────────────────────────────────────

export const createHeroSlideSchema = z.object({
  title: nonEmpty("Title"),
  subtitle: optionalString("Subtitle"),
  ctaLabel: optionalString("CTA label"),
  ctaHref: optionalString("CTA URL"),
  imageUrl: nonEmpty("Image"),
  imageAlt: optionalString("Image alt text"),
  durationSeconds: z.coerce.number().min(1).max(30).default(5),
  order,
});

export const updateHeroSlideSchema = createHeroSlideSchema.extend({
  id: cuid,
  isActive: z.string().transform((v) => v === "on" || v === "true").optional().default("false"),
});

// ── Testimonials ─────────────────────────────────────────────

export const createTestimonialSchema = z.object({
  quote: z.string().trim().min(10, "Quote must be at least 10 characters").max(2000),
  authorName: nonEmpty("Author name"),
  authorRole: optionalString("Author role"),
  authorOrg: optionalString("Author organization"),
  avatarUrl: optionalUrl,
  rating: z.coerce.number().int().min(1).max(5).optional().default(5),
  order,
});

export const updateTestimonialSchema = createTestimonialSchema.extend({
  id: cuid,
  isActive: z.string().transform((v) => v === "on" || v === "true").optional().default("false"),
});

// ── Leader Messages ──────────────────────────────────────────

export const createLeaderMessageSchema = z.object({
  leaderName: nonEmpty("Leader name"),
  title: nonEmpty("Title"),
  role: nonEmpty("Role"),
  photoUrl: optionalUrl,
  message: z.string().trim().min(1, "Message is required").max(10000),
  signature: optionalString("Signature"),
  order,
});

export const updateLeaderMessageSchema = createLeaderMessageSchema.extend({
  id: cuid,
  isActive: z.string().transform((v) => v === "on" || v === "true").optional().default("false"),
});

// ── Milestones ───────────────────────────────────────────────

export const createMilestoneSchema = z.object({
  year: z.string().regex(/^\d{4}$/, "Year must be 4 digits"),
  title: nonEmpty("Title"),
  description: nonEmpty("Description"),
  imageUrl: optionalUrl,
  order,
});

export const updateMilestoneSchema = createMilestoneSchema.extend({
  id: cuid,
  isActive: z.string().transform((v) => v === "on" || v === "true").optional().default("false"),
});

// ── Service Areas ────────────────────────────────────────────

export const createServiceAreaSchema = z.object({
  title: nonEmpty("Title"),
  description: nonEmpty("Description"),
  icon: z.string().min(1).max(50).default("BookOpen"),
  color: z.string().min(1).max(100).default("from-blue-500 to-blue-600"),
  order,
});

export const updateServiceAreaSchema = createServiceAreaSchema.extend({
  id: cuid,
  isActive: z.string().transform((v) => v === "on" || v === "true").optional().default("false"),
});

// ── Site Stats ───────────────────────────────────────────────

export const createSiteStatSchema = z.object({
  label: nonEmpty("Label"),
  value: nonEmpty("Value"),
  icon: optionalString("Icon"),
  order,
});

export const updateSiteStatSchema = createSiteStatSchema.extend({
  id: cuid,
  isActive: z.string().transform((v) => v === "on" || v === "true").optional().default("false"),
});

// ── Site Images ──────────────────────────────────────────────

export const upsertSiteImageSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Key must be lowercase with hyphens"),
  label: nonEmpty("Label"),
  url: nonEmpty("URL"),
  alt: optionalString("Alt text"),
});

// ── Volunteer ────────────────────────────────────────────────

export const createVolunteerSchema = z.object({
  title: nonEmpty("Title"),
  slug: slug.optional(),
  department: nonEmpty("Department"),
  location: nonEmpty("Location"),
  commitment: nonEmpty("Commitment"),
  description: nonEmpty("Description"),
  requirements: textList.optional().default(""),
  benefits: textList.optional().default(""),
});

export const updateVolunteerSchema = createVolunteerSchema.extend({
  id: cuid,
  isActive: z.string().transform((v) => v === "on" || v === "true").optional().default("false"),
});

// ── Translations ─────────────────────────────────────────────

export const upsertTranslationSchema = z.object({
  locale: z.string().min(2).max(10),
  key: z.string().min(1).max(200),
  value: z.string().min(1, "Value is required"),
});

// ── Contact Messages ─────────────────────────────────────────

export const messageIdSchema = z.object({
  id: cuid,
});

// ── Partner Applications ─────────────────────────────────────

export const updatePartnerAppStatusSchema = z.object({
  id: cuid,
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

// ── Volunteer Application Status ─────────────────────────────

export const updateVolunteerAppStatusSchema = z.object({
  id: cuid,
  status: z.enum(["SUBMITTED", "APPROVED", "REJECTED"]),
});

// ── Career Application Status ────────────────────────────────

export const updateCareerAppStatusSchema = z.object({
  id: cuid,
  status: z.enum(["SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"]),
  notes: optionalString("Notes"),
});

// ── Toggle (shared) ──────────────────────────────────────────

export const toggleSchema = z.object({
  id: cuid,
  isActive: z.string().transform((v) => v === "true"),
});

// ── Delete (shared) ──────────────────────────────────────────

export const deleteSchema = z.object({
  id: cuid,
});
