import { z } from "zod";
import type { PageCollectionKind } from "@/lib/pages/collections";

/**
 * Typed block registry. Every block that can appear in Page.blocks /
 * Program.body / Post.body must be declared here. The registry is the
 * single source of truth shared by:
 *
 *   • Zod validation (admin Server Actions)
 *   • BlockRenderer (public RSC, renders by `type`)
 *   • BlockEditor (admin client, knows which editor to show)
 *
 * Adding a new block = one entry here + one renderer component + one
 * editor component. Everything else (validation, persistence) is
 * automatic via the discriminated union below.
 */

// ─── Individual block data schemas ───────────────────────────

export const heroBlockSchema = z.object({
  eyebrow: z.string().max(80).optional(),
  heading: z.string().min(1).max(200),
  subheading: z.string().max(400).optional(),
  ctaLabel: z.string().max(40).optional(),
  ctaHref: z.string().max(500).optional(),
  secondaryCtaLabel: z.string().max(40).optional(),
  secondaryCtaHref: z.string().max(500).optional(),
  imageMediaId: z.string().optional(),
});

export const richTextBlockSchema = z.object({
  html: z.string().max(100_000),
});

export const ctaBlockSchema = z.object({
  heading: z.string().min(1).max(200),
  body: z.string().max(600).optional(),
  buttonLabel: z.string().min(1).max(40),
  buttonHref: z.string().min(1).max(500),
  variant: z.enum(["primary", "secondary", "outline"]).default("primary"),
});

export const statsBlockSchema = z.object({
  heading: z.string().max(200).optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        value: z.string().min(1).max(40),
      }),
    )
    .min(1)
    .max(8),
});

export const galleryBlockSchema = z.object({
  heading: z.string().max(200).optional(),
  // Allow empty during authoring; the renderer skips blocks with no media.
  mediaIds: z.array(z.string()).max(24).default([]),
});

export const donateCtaBlockSchema = z.object({
  heading: z.string().min(1).max(200),
  body: z.string().max(400).optional(),
  campaignSlug: z.string().optional(),
  buttonLabel: z.string().min(1).max(40).default("Donate"),
});

export const programGridBlockSchema = z.object({
  heading: z.string().max(200).optional(),
  intro: z.string().max(400).optional(),
  limit: z.number().int().min(1).max(12).default(6),
});

export const postListBlockSchema = z.object({
  heading: z.string().max(200).optional(),
  intro: z.string().max(400).optional(),
  limit: z.number().int().min(1).max(12).default(3),
});

export const featureSplitBlockSchema = z.object({
  eyebrow: z.string().max(80).optional(),
  heading: z.string().min(1).max(200),
  body: z.string().max(1000),
  ctaLabel: z.string().max(40).optional(),
  ctaHref: z.string().max(500).optional(),
  imageMediaId: z.string().optional(),
  reverse: z.boolean().default(false),
});

export const actionCardsBlockSchema = z.object({
  heading: z.string().max(200).optional(),
  intro: z.string().max(400).optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(240),
        href: z.string().min(1).max(500),
        label: z.string().min(1).max(40),
      }),
    )
    .min(1)
    .max(6),
});

export const eventListBlockSchema = z.object({
  heading: z.string().max(200).optional(),
  intro: z.string().max(400).optional(),
  limit: z.number().int().min(1).max(6).default(3),
});

export const partnerLogosBlockSchema = z.object({
  heading: z.string().max(200).optional(),
  intro: z.string().max(400).optional(),
  mediaIds: z.array(z.string()).max(16).default([]),
});

export const pageCollectionBlockSchema = z.object({
  heading: z.string().max(200).optional(),
  intro: z.string().max(500).optional(),
  collection: z.custom<PageCollectionKind>((value) =>
    ["impactStory", "team", "report", "partner"].includes(String(value)),
  ),
  limit: z.number().int().min(1).max(12).default(6),
});

// ─── Discriminated union (the block envelope) ─────────────────

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("hero"), data: heroBlockSchema }),
  z.object({ id: z.string(), type: z.literal("richText"), data: richTextBlockSchema }),
  z.object({ id: z.string(), type: z.literal("cta"), data: ctaBlockSchema }),
  z.object({ id: z.string(), type: z.literal("stats"), data: statsBlockSchema }),
  z.object({ id: z.string(), type: z.literal("gallery"), data: galleryBlockSchema }),
  z.object({ id: z.string(), type: z.literal("donateCta"), data: donateCtaBlockSchema }),
  z.object({ id: z.string(), type: z.literal("programGrid"), data: programGridBlockSchema }),
  z.object({ id: z.string(), type: z.literal("postList"), data: postListBlockSchema }),
  z.object({ id: z.string(), type: z.literal("featureSplit"), data: featureSplitBlockSchema }),
  z.object({ id: z.string(), type: z.literal("actionCards"), data: actionCardsBlockSchema }),
  z.object({ id: z.string(), type: z.literal("eventList"), data: eventListBlockSchema }),
  z.object({ id: z.string(), type: z.literal("partnerLogos"), data: partnerLogosBlockSchema }),
  z.object({ id: z.string(), type: z.literal("pageCollection"), data: pageCollectionBlockSchema }),
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

export const blocksSchema = z.array(blockSchema).max(100);

// ─── Metadata the editor consumes ─────────────────────────────

export const BLOCK_META: Record<
  BlockType,
  { label: string; description: string; emptyData: Block["data"] }
> = {
  hero: {
    label: "Hero",
    description: "Large heading with optional subheading, CTA, and image",
    emptyData: { heading: "New hero" },
  },
  richText: {
    label: "Rich text",
    description: "Prose content",
    emptyData: { html: "<p>Write something\u2026</p>" },
  },
  cta: {
    label: "Call to action",
    description: "Heading, body, and button",
    emptyData: { heading: "Get involved", buttonLabel: "Learn more", buttonHref: "/about", variant: "primary" },
  },
  stats: {
    label: "Stats",
    description: "Up to 8 label/value pairs",
    emptyData: { items: [{ label: "People reached", value: "0" }] },
  },
  gallery: {
    label: "Gallery",
    description: "Media grid",
    emptyData: { mediaIds: [] },
  },
  donateCta: {
    label: "Donate CTA",
    description: "Call to donate, optionally tied to a campaign",
    emptyData: { heading: "Support our work", buttonLabel: "Donate" },
  },
  programGrid: {
    label: "Programs grid",
    description: "Auto-populated with latest published programs",
    emptyData: { limit: 6 },
  },
  postList: {
    label: "Latest posts",
    description: "Auto-populated with latest published blog posts",
    emptyData: { limit: 3 },
  },
  featureSplit: {
    label: "Feature split",
    description: "Two-column story section with image and CTA",
    emptyData: { heading: "Mission in action", body: "Tell the story behind the work." },
  },
  actionCards: {
    label: "Action cards",
    description: "Grid of CTA cards like volunteer, careers, or partner",
    emptyData: {
      heading: "Get involved",
      items: [{ title: "Volunteer", body: "Join a local effort.", href: "/volunteer", label: "Learn more" }],
    },
  },
  eventList: {
    label: "Upcoming events",
    description: "Auto-populated with public events",
    emptyData: { limit: 3 },
  },
  partnerLogos: {
    label: "Partner logos",
    description: "Trusted partners and supporters",
    emptyData: { mediaIds: [] },
  },
  pageCollection: {
    label: "Page collection",
    description: "Auto-populated cards from impact stories, team, partners, or reports",
    emptyData: { collection: "impactStory", limit: 6 },
  },
};

export function newBlock<T extends BlockType>(type: T): Block {
  return {
    id: crypto.randomUUID(),
    type,
    data: BLOCK_META[type].emptyData,
  } as Block;
}
