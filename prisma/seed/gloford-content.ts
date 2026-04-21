/**
 * Gloford-specific seed content.
 *
 * All text is drawn from the live site (gloford.org, archived copy),
 * adapted lightly for the block system. Images reference locally
 * downloaded files under /public/seed-images/ — no external CDN
 * required for the demo to render.
 *
 * The seeded Subscriber / Newsletter / Event rows are illustrative so
 * admins can see the UI populated immediately.
 */

import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";

// ─── Media manifest (files already exist in public/seed-images/) ───

export const MEDIA_FILES = [
  { key: "gloford/logo.png", url: "/seed-images/gloford/logo.png", mime: "image/png", width: 300, height: 90, alt: "Gloford logo", size: 12801 },
  { key: "gloford/hero-youth.jpg", url: "/seed-images/gloford/hero-youth.jpg", mime: "image/jpeg", width: 1920, height: 1080, alt: "Young people in community program", size: 858480 },
  { key: "gloford/hero-climate.jpg", url: "/seed-images/gloford/hero-climate.jpg", mime: "image/jpeg", width: 1920, height: 1080, alt: "Climate change action", size: 1424336 },
  { key: "gloford/hero-intern.jpg", url: "/seed-images/gloford/hero-intern.jpg", mime: "image/jpeg", width: 1280, height: 720, alt: "Intern training session", size: 63396 },
  { key: "gloford/hero-community.jpg", url: "/seed-images/gloford/hero-community.jpg", mime: "image/jpeg", width: 1920, height: 1080, alt: "Community gathering", size: 1010198 },
  { key: "gloford/hero-staff.jpg", url: "/seed-images/gloford/hero-staff.jpg", mime: "image/jpeg", width: 1200, height: 800, alt: "Gloford staff photo", size: 151642 },
  { key: "gloford/hero-field.jpg", url: "/seed-images/gloford/hero-field.jpg", mime: "image/jpeg", width: 1920, height: 1080, alt: "Field work in Northern Uganda", size: 531691 },
  { key: "gloford/hero-radio.jpg", url: "/seed-images/gloford/hero-radio.jpg", mime: "image/jpeg", width: 1200, height: 800, alt: "Community radio engagement", size: 45871 },
  { key: "people/chairman.jpeg", url: "/seed-images/people/chairman.jpeg", mime: "image/jpeg", width: 741, height: 834, alt: "Dr. Benson Obua-Ogwal, Board Chair", size: 139548 },
  { key: "people/ceo.jpg", url: "/seed-images/people/ceo.jpg", mime: "image/jpeg", width: 720, height: 720, alt: "Dr. Morris Chris Ongom, CEO", size: 7750 },
  { key: "partners/cehurd.jpeg", url: "/seed-images/partners/cehurd.jpeg", mime: "image/jpeg", width: 275, height: 183, alt: "CEHURD logo", size: 5286 },
  { key: "partners/plan.png", url: "/seed-images/partners/plan.png", mime: "image/png", width: 204, height: 192, alt: "PLAN International logo", size: 4283 },
  { key: "partners/pepfar.png", url: "/seed-images/partners/pepfar.png", mime: "image/png", width: 293, height: 172, alt: "PEPFAR logo", size: 151642 },
  { key: "partners/wood-en-daad.png", url: "/seed-images/partners/wood-en-daad.png", mime: "image/png", width: 204, height: 192, alt: "Wood en Daad logo", size: 2695 },
] as const;

export type MediaKey = (typeof MEDIA_FILES)[number]["key"];

// ─── Block builder helpers ──────────────────────────────────

const uid = () => randomBytes(8).toString("hex");

const hero = (d: {
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageMediaId?: string;
}) => ({ id: uid(), type: "hero" as const, data: d });

const richText = (html: string) => ({ id: uid(), type: "richText" as const, data: { html } });

const cta = (d: {
  heading: string;
  body?: string;
  buttonLabel: string;
  buttonHref: string;
  variant?: "primary" | "secondary" | "outline";
}) => ({
  id: uid(),
  type: "cta" as const,
  data: { variant: "primary" as const, ...d },
});

const stats = (d: { heading?: string; items: { label: string; value: string }[] }) => ({
  id: uid(),
  type: "stats" as const,
  data: d,
});

const donateCta = (d: {
  heading: string;
  body?: string;
  campaignSlug?: string;
  buttonLabel?: string;
}) => ({
  id: uid(),
  type: "donateCta" as const,
  data: { buttonLabel: "Donate", ...d },
});

const programGrid = (d: { heading?: string; limit?: number }) => ({
  id: uid(),
  type: "programGrid" as const,
  data: { limit: 6, ...d },
});

const postList = (d: { heading?: string; limit?: number }) => ({
  id: uid(),
  type: "postList" as const,
  data: { limit: 3, ...d },
});

// ─── Pages ───────────────────────────────────────────────────

export const PAGES = [
  {
    slug: "about",
    title: "About Gloford",
    seoTitle: "About Gloford Uganda",
    seoDesc:
      "Gloford has been transforming communities and empowering Uganda's youth since 2010, guided by a Christian foundational creed.",
    status: "PUBLISHED" as const,
    blocks: [
      hero({
        heading: "About Gloford",
        subheading:
          "Since 2010, Gloford has been steadfast in its commitment to transforming communities and empowering Uganda's youth.",
      }),
      richText(`
        <h2>Our Mission</h2>
        <p>To inspire and educate young people and the community through value-based leadership, fostering transformation in the lives of vulnerable households.</p>
        <h2>Our Vision</h2>
        <p>A community of empowered young people and families able to take charge of their own transformation and development.</p>
        <h2>Where we work</h2>
        <p>We serve the people of Northern Uganda with life-changing projects that address youth development, community health, child protection, livelihoods, governance, and institutional strengthening.</p>
      `),
      stats({
        heading: "15 years in service",
        items: [
          { label: "Years in service", value: "15+" },
          { label: "Projects delivered", value: "20+" },
          { label: "Staff employed", value: "50+" },
          { label: "Beneficiaries reached", value: "100k+" },
        ],
      }),
      cta({
        heading: "Join us in transforming communities",
        body: "Whether you volunteer, partner, or give, your support makes our mission possible.",
        buttonLabel: "Get involved",
        buttonHref: "/contact",
      }),
    ],
  },
  {
    slug: "contact",
    title: "Contact us",
    seoTitle: "Contact Gloford",
    seoDesc: "Reach the Gloford Uganda team.",
    status: "PUBLISHED" as const,
    blocks: [
      hero({
        heading: "Get in touch",
        subheading: "We'd love to hear from you. Partnerships, volunteering, media — all welcome.",
      }),
      richText(`
        <h2>Head office</h2>
        <p>GLOFORD Uganda<br>Plot 123, Gulu Town<br>Northern Uganda</p>
        <h2>Contact</h2>
        <p><strong>Email:</strong> info@gloford.org<br><strong>Phone:</strong> +256 (0) 000 000 000</p>
      `),
    ],
  },
] as const;

// ─── Programs ───────────────────────────────────────────────

export const PROGRAMS = [
  {
    slug: "yodel",
    title: "Youth Development and Leadership (YoDeL)",
    summary:
      "Equipping young people with values-based leadership, life skills, and economic opportunities so they can lead change in their communities.",
    order: 1,
    status: "PUBLISHED" as const,
    body: [
      hero({
        heading: "Youth Development and Leadership",
        subheading:
          "YoDeL is Gloford's flagship program — mentoring the next generation of community leaders in Northern Uganda.",
      }),
      richText(`
        <h2>What we do</h2>
        <p>Through YoDeL we run leadership academies, vocational skills training, mentorship circles, and enterprise incubation. Participants graduate ready to lead civic, economic, and faith-based transformation.</p>
        <h2>2024 highlights</h2>
        <ul><li>250+ youth mentors trained</li><li>12 leadership academies hosted across five districts</li><li>Three enterprise cohorts launched small businesses</li></ul>
      `),
    ],
  },
  {
    slug: "cdproa",
    title: "Child Development, Protection, and Advocacy (CDProA)",
    summary:
      "Safeguarding children's rights and creating the conditions for them to thrive — education, protection, and advocacy.",
    order: 2,
    status: "PUBLISHED" as const,
    body: [
      hero({
        heading: "Children first",
        subheading: "Every child deserves safety, schooling, and the chance to grow up well.",
      }),
      richText(`
        <p>CDProA partners with schools, families, and local government to prevent abuse, keep children in school, and champion policy reform at district and national level.</p>
      `),
    ],
  },
  {
    slug: "gova",
    title: "Governance, Voice, and Accountability (GoVA)",
    summary:
      "Building citizen voice and transparent local government. We convene, train, and support communities to demand better public services.",
    order: 3,
    status: "PUBLISHED" as const,
    body: [
      hero({ heading: "Governance, Voice, and Accountability" }),
      richText(`
        <p>GoVA runs community dialogues, citizen scorecards, and local-media partnerships — so that budgets are spent where they are promised and leaders stay answerable.</p>
      `),
    ],
  },
  {
    slug: "community-health",
    title: "Community Health",
    summary:
      "WASH, mental health, SRHR, malaria, TB, MNCH, HIV/AIDS, and nutrition — delivered where people live, with people they trust.",
    order: 4,
    status: "PUBLISHED" as const,
    body: [
      hero({ heading: "Health where it's needed most" }),
      richText(`
        <h2>Service areas</h2>
        <p>Gloford's community health portfolio covers water, sanitation and hygiene (WASH); mental health; sexual and reproductive health and rights (SRHR); malaria; tuberculosis; maternal, newborn and child health (MNCH); HIV/AIDS prevention and care; and nutrition.</p>
        <p>We partner with health centres, faith leaders, schools, and community health workers to deliver services that are trusted locally and effective clinically.</p>
      `),
    ],
  },
  {
    slug: "porl",
    title: "Poverty Reduction and Livelihoods (PoRL)",
    summary:
      "Savings groups, climate-smart agriculture, and enterprise training that turn households from surviving to thriving.",
    order: 5,
    status: "PUBLISHED" as const,
    body: [
      hero({ heading: "From surviving to thriving" }),
      richText(`
        <p>PoRL supports village savings and loan associations, agribusiness cooperatives, and women-led enterprises. The combination of capital, training, and market access shifts households off the subsistence edge.</p>
      `),
    ],
  },
  {
    slug: "idos",
    title: "Institutional Development and Organizational Strengthening (IDOS)",
    summary:
      "Helping partner organizations — CBOs, faith-based groups, small NGOs — build the systems they need to scale their impact.",
    order: 6,
    status: "PUBLISHED" as const,
    body: [
      hero({ heading: "Institutional Development and Organizational Strengthening" }),
      richText(`
        <p>Through IDOS we offer governance training, M&amp;E support, financial-systems setup, and fundraising coaching to partner organizations across the region.</p>
      `),
    ],
  },
] as const;

// ─── Blog posts ─────────────────────────────────────────────

export const POSTS = [
  {
    slug: "15-years-of-gloford",
    title: "15 years of Gloford: what we've learned",
    excerpt:
      "From a handful of volunteers in 2010 to 50+ staff serving across Northern Uganda, here are the lessons we'll carry forward.",
    status: "PUBLISHED" as const,
    tagSlugs: ["reflection", "impact"],
    body: [
      hero({ heading: "15 years of Gloford" }),
      richText(`
        <p>When we started in 2010, Northern Uganda was still recovering from decades of conflict. Our founders believed — and still believe — that value-based leadership is the most durable antidote to cycles of poverty and displacement.</p>
        <p>Fifteen years in, we've served more than 100,000 beneficiaries and run 20 major projects across six strategic areas. These are the lessons we're carrying into the next chapter.</p>
        <h2>1. Communities know what they need</h2>
        <p>Every program that has worked started with a community dialogue, not a logframe.</p>
        <h2>2. Faith and competence are not in tension</h2>
        <p>Our Christian foundational creed motivates us; professional rigour makes us effective.</p>
        <h2>3. Partnerships beat heroics</h2>
        <p>CEHURD, PLAN International, PEPFAR, and Wood en Daad have been with us for most of this journey. None of our impact is ours alone.</p>
      `),
      cta({
        heading: "Help shape the next 15 years",
        body: "Subscribe to our newsletter for program updates, stories from the field, and invitations to join.",
        buttonLabel: "Visit our programs",
        buttonHref: "/programs",
        variant: "primary",
      }),
    ],
  },
  {
    slug: "climate-change-youth-action",
    title: "Youth, climate, and leadership in Northern Uganda",
    excerpt:
      "How young Gloford mentors are putting climate resilience on the agenda in their districts.",
    status: "PUBLISHED" as const,
    tagSlugs: ["yodel", "climate"],
    body: [
      hero({ heading: "Youth, climate, and leadership" }),
      richText(`
        <p>Climate change is not abstract in Gulu. Unpredictable rains and longer dry seasons are already hitting smallholder farmers. Our YoDeL cohorts are running climate-smart agriculture clinics, tree-planting drives, and radio debates that put local-government climate budgets under citizen scrutiny.</p>
      `),
    ],
  },
  {
    slug: "new-intern-cohort-2025",
    title: "Welcoming our 2025 internship cohort",
    excerpt: "Twelve new interns joined Gloford this month across five program areas.",
    status: "PUBLISHED" as const,
    tagSlugs: ["people"],
    body: [
      hero({ heading: "New interns, new energy" }),
      richText(`
        <p>We're delighted to welcome twelve new interns who will spend the next six months embedded in our YoDeL, Community Health, CDProA, GoVA, and PoRL programs. Their backgrounds span public-health, development studies, social work, and media.</p>
      `),
    ],
  },
] as const;

// ─── Campaign ───────────────────────────────────────────────

export const CAMPAIGN = {
  slug: "empower-ugandas-youth",
  title: "Empower Uganda's Youth",
  description:
    "Our flagship fundraising drive: scale YoDeL mentorship and enterprise incubation to reach 1,000 young leaders by 2027. Every contribution funds training, mentorship, and first-year enterprise capital.",
  goalCents: 5_000_000,
  currency: "USD",
  isActive: true,
} as const;

// ─── Subscribers ────────────────────────────────────────────

export const SUBSCRIBERS = [
  { email: "joyce.ongom@example.org", name: "Joyce Ongom", segments: ["volunteers"] },
  { email: "pastor.moses@example.org", name: "Pastor Moses", segments: ["partners"] },
  { email: "grace.komi@example.org", name: "Grace Komi", segments: ["youth"] },
  { email: "david.otim@example.org", name: "David Otim", segments: ["donors"] },
  { email: "mary.akot@example.org", name: "Mary Akot", segments: ["youth", "volunteers"] },
  { email: "sam.kitara@example.org", name: "Sam Kitara", segments: ["donors", "partners"] },
] as const;

// ─── Newsletter (one draft) ─────────────────────────────────

export const NEWSLETTER = {
  title: "April 2026 newsletter (draft)",
  subject: "Gloford spring update: 15 years, new programs, how to help",
  preheader: "Stories from the field, new YoDeL cohort, and how you can support.",
  content: [
    hero({ heading: "Spring at Gloford" }),
    richText(`<p>As we mark 15 years of Gloford, here's what's happening across our programs this quarter \u2014 and a few ways you can join in.</p>`),
    cta({
      heading: "Read our latest",
      buttonLabel: "Read the blog",
      buttonHref: "/blog",
      variant: "primary",
    }),
    donateCta({
      heading: "Support YoDeL",
      body: "Our flagship youth leadership program needs you.",
      campaignSlug: "empower-ugandas-youth",
    }),
  ],
} as const;

// ─── Event ──────────────────────────────────────────────────

export const EVENT = {
  slug: "gloford-15-years-celebration",
  title: "Gloford at 15: community celebration",
  description:
    "Join staff, partners, youth, and community members for an afternoon of stories, food, and music to mark Gloford's 15th anniversary.",
  // Set to ~3 months out from today.
  startsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
  location: "Gulu Community Hall, Northern Uganda",
  isPublic: true,
} as const;

// ─── Nav item overrides ─────────────────────────────────────

export const HEADER_NAV = [
  { href: "/", label: "Home", order: 0 },
  { href: "/about", label: "About", order: 1 },
  { href: "/programs", label: "Programs", order: 2 },
  { href: "/blog", label: "Blog", order: 3 },
  { href: "/events", label: "Events", order: 4 },
  { href: "/contact", label: "Contact", order: 5 },
] as const;

export const FOOTER_NAV = [
  { href: "/about", label: "About", order: 0 },
  { href: "/programs", label: "Programs", order: 1 },
  { href: "/donate", label: "Donate", order: 2 },
  { href: "/contact", label: "Contact", order: 3 },
] as const;

/** Helper used in seed.ts to avoid pulling in the full Prisma Json type chain. */
export function asJson(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}
