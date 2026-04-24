/**
 * White-label seed.
 *
 * Reads brand identity from env vars so the same script boots any client.
 * Idempotent — safe to re-run.
 *
 * When SEED_DEMO="gloford" (default), also seeds demo content pulled
 * from gloford.org: stock images in public/seed-images/ become Media
 * rows, plus sample Pages/Programs/Posts/Campaign/Event.
 *
 * For a clean white-label template (no demo content), set
 *   SEED_DEMO=""
 * in the environment.
 */

import bcrypt from "bcryptjs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, type RoleName } from "@prisma/client";
import { PERMISSIONS, ROLE_MATRIX } from "../lib/rbac/permissions";

const db = new PrismaClient();

const BRAND_NAME = process.env.BRAND_NAME ?? "Gloford Foundation";
const BRAND_LOGO_URL = process.env.BRAND_LOGO_URL ?? "/seed-images/gloford/logo.png";
const BRAND_PRIMARY_COLOR = process.env.BRAND_PRIMARY_COLOR ?? "#2563eb";
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@gloford.org";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "change-me-on-first-login";
const SEED_DEMO = (process.env.SEED_DEMO ?? "gloford").toLowerCase();

async function main() {
  console.log("→ Seeding roles & permissions…");
  await seedRolesAndPermissions();

  console.log("→ Seeding site settings, theme, nav, segments…");
  await seedBasics();

  console.log("→ Seeding admin user…");
  const adminId = await seedAdminUser();

  if (SEED_DEMO === "gloford") {
    console.log("→ Seeding Gloford demo content (stock images, pages, programs, posts)…");
    await seedGlofordDemo(adminId);
  }

  console.log("✓ Seed complete");
}

// ─── Roles & permissions ─────────────────────────────────────────

async function seedRolesAndPermissions() {
  const ROLES: RoleName[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];
  for (const name of ROLES) {
    await db.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystem: true, description: `System-defined ${name} role` },
    });
  }

  for (const p of PERMISSIONS) {
    await db.permission.upsert({
      where: { key: p.key },
      update: {
        module: p.module,
        action: p.action,
        resourceType: p.resourceType,
        scope: p.scope,
        description: p.description,
      },
      create: {
        key: p.key,
        module: p.module,
        action: p.action,
        resourceType: p.resourceType,
        scope: p.scope,
        description: p.description,
      },
    });
  }

  for (const [roleName, modules] of Object.entries(ROLE_MATRIX) as [
    RoleName,
    Record<string, "*" | string[]>,
  ][]) {
    const role = await db.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    const allowed = new Set<string>();
    for (const p of PERMISSIONS) {
      const grant = modules[p.module];
      if (!grant) continue;
      if (grant === "*" || grant.includes(p.action)) allowed.add(p.key);
    }

    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    const perms = await db.permission.findMany({
      where: { key: { in: Array.from(allowed) } },
    });
    await db.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
}

// ─── Site settings, theme, nav, segments ─────────────────────────

async function seedBasics() {
  await db.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteName: BRAND_NAME,
      logoUrl: BRAND_LOGO_URL,
      loginBgUrl: SEED_DEMO === "gloford" ? "/seed-images/gloford/hero-community.jpg" : null,
      contact: { email: SEED_ADMIN_EMAIL } as never,
      socials: {} as never,
      seo: {
        defaultTitle: BRAND_NAME,
        defaultDescription: `${BRAND_NAME} — official website`,
      } as never,
    },
  });

  const primaryRgb = hexToRgbTriplet(BRAND_PRIMARY_COLOR) ?? "201 168 76";

  await db.theme.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      colors: {
        primary: primaryRgb,
        "primary-fg": "255 255 255",
      } as never,
      typography: {} as never,
      radius: {} as never,
      shadows: {} as never,
    },
  });

  const nav: Array<{
    location: "HEADER" | "FOOTER";
    label: string;
    href: string;
    order: number;
  }> = [
    { location: "HEADER", label: "Home", href: "/", order: 0 },
    { location: "HEADER", label: "About", href: "/about", order: 1 },
    { location: "HEADER", label: "Programs", href: "/programs", order: 2 },
    { location: "HEADER", label: "Blog", href: "/blog", order: 3 },
    { location: "HEADER", label: "Events", href: "/events", order: 4 },
    { location: "HEADER", label: "Contact", href: "/contact", order: 5 },
    { location: "FOOTER", label: "About", href: "/about", order: 0 },
    { location: "FOOTER", label: "Programs", href: "/programs", order: 1 },
    { location: "FOOTER", label: "Blog", href: "/blog", order: 2 },
    { location: "FOOTER", label: "Events", href: "/events", order: 3 },
  ];
  for (const item of nav) {
    const existing = await db.navItem.findFirst({
      where: { location: item.location, label: item.label },
    });
    if (!existing) await db.navItem.create({ data: item });
  }

  const segments = [
    { slug: "donors", name: "Donors", description: "People who have donated at least once", isSystem: true },
    { slug: "volunteers", name: "Volunteers", description: "Volunteers and supporters", isSystem: true },
  ];
  for (const s of segments) {
    await db.segment.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }
}

// ─── Admin user ──────────────────────────────────────────────────

async function seedAdminUser(): Promise<string> {
  const superAdminRole = await db.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (!superAdminRole) throw new Error("SUPER_ADMIN role missing — run role seed first");

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
  const user = await db.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: { roleId: superAdminRole.id, isActive: true },
    create: {
      email: SEED_ADMIN_EMAIL,
      name: "Administrator",
      passwordHash,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  console.log(`  admin: ${SEED_ADMIN_EMAIL}`);
  if (SEED_ADMIN_PASSWORD === "change-me-on-first-login") {
    console.log("  ⚠  Using default admin password. Change it immediately in production.");
  }

  return user.id;
}

// ─── Gloford demo content ───────────────────────────────────────

const GLOFORD_IMAGES = [
  { key: "hero-community", file: "gloford/hero-community.jpg", alt: "Community gathering" },
  { key: "hero-youth", file: "gloford/hero-youth.jpg", alt: "Youth program" },
  { key: "hero-field", file: "gloford/hero-field.jpg", alt: "Field work" },
  { key: "hero-climate", file: "gloford/hero-climate.jpg", alt: "Climate resilience" },
  { key: "hero-staff", file: "gloford/hero-staff.jpg", alt: "Staff at work" },
  { key: "hero-radio", file: "gloford/hero-radio.jpg", alt: "Radio broadcast" },
  { key: "hero-intern", file: "gloford/hero-intern.jpg", alt: "Intern program" },
  { key: "logo", file: "gloford/logo.png", alt: "Gloford logo" },
  { key: "people-ceo", file: "people/ceo.jpg", alt: "CEO portrait" },
  { key: "people-chairman", file: "people/chairman.jpeg", alt: "Chairman portrait" },
  { key: "partner-pepfar", file: "partners/pepfar.png", alt: "PEPFAR logo" },
  { key: "partner-plan", file: "partners/plan.png", alt: "Plan International logo" },
  { key: "partner-wood-en-daad", file: "partners/wood-en-daad.png", alt: "Wood-en-Daad logo" },
  { key: "partner-cehurd", file: "partners/cehurd.jpeg", alt: "CEHURD logo" },
];

type SeededMedia = { id: string; url: string; key: string };

async function seedGlofordDemo(adminId: string): Promise<void> {
  const mediaMap = await seedStockMedia(adminId);
  await seedDemoPages(mediaMap);
  await seedDemoPrograms(mediaMap);
  await seedDemoPosts(adminId, mediaMap);
  await seedDemoCampaign();
  await seedDemoEvent(mediaMap);
}

/**
 * Register the /public/seed-images/* files as Media rows. We don't
 * upload them anywhere — they're served directly by Next's /public/
 * static handler. In production with R2 enabled, admins re-upload via
 * the admin UI; the seed stays a dev convenience.
 */
async function seedStockMedia(adminId: string): Promise<Record<string, SeededMedia>> {
  const map: Record<string, SeededMedia> = {};
  const publicRoot = path.join(process.cwd(), "public", "seed-images");

  for (const img of GLOFORD_IMAGES) {
    const diskPath = path.join(publicRoot, img.file);
    let sizeBytes = 0;
    try {
      const st = await stat(diskPath);
      sizeBytes = Number(st.size);
    } catch {
      console.log(`  skipping media ${img.key}: file not found at ${diskPath}`);
      continue;
    }

    const mime = img.file.endsWith(".png")
      ? "image/png"
      : img.file.endsWith(".jpeg")
        ? "image/jpeg"
        : "image/jpeg";
    const url = `/seed-images/${img.file}`;
    const keyField = `seed:${img.key}`;

    const existing = await db.media.findUnique({ where: { key: keyField } });
    const row = existing
      ? existing
      : await db.media.create({
          data: {
            key: keyField,
            url,
            mime,
            sizeBytes,
            alt: img.alt,
            uploadedById: adminId,
          },
        });
    map[img.key] = { id: row.id, url: row.url, key: keyField };
  }

  return map;
}

async function seedDemoPages(media: Record<string, SeededMedia>) {
  const homeHero = media["hero-community"]?.id;
  const aboutHero = media["hero-field"]?.id;

  const pages = [
    {
      slug: "home",
      title: `${BRAND_NAME} — home`,
      seoDesc: "Community partnerships for health, education, and resilience.",
      blocks: [
        {
          id: "p-home-hero",
          type: "hero",
          data: {
            heading: "Changing lives through community action.",
            subheading:
              `${BRAND_NAME} partners with communities across Uganda to advance health, education, and climate resilience.`,
            ctaLabel: "Support our work",
            ctaHref: "/donate",
            ...(homeHero ? { imageMediaId: homeHero } : {}),
          },
        },
        {
          id: "p-home-stats",
          type: "stats",
          data: {
            heading: "Our impact, at a glance",
            items: [
              { label: "People reached", value: "120k+" },
              { label: "Districts served", value: "14" },
              { label: "Community partners", value: "40+" },
              { label: "Years on the ground", value: "15" },
            ],
          },
        },
        {
          id: "p-home-programs",
          type: "programGrid",
          data: { heading: "Our programs", limit: 4 },
        },
        {
          id: "p-home-posts",
          type: "postList",
          data: { heading: "Latest stories", limit: 3 },
        },
        {
          id: "p-home-donate",
          type: "donateCta",
          data: {
            heading: "Stand with communities building a better tomorrow.",
            body: "Your support funds seed kits, mobile clinics, youth mentorship, and community radio — work that only happens when people like you back it.",
            buttonLabel: "Donate now",
          },
        },
      ],
    },
    {
      slug: "about",
      title: `About ${BRAND_NAME}`,
      seoDesc: "Who we are and the work we do.",
      blocks: [
        {
          id: "p-about-hero",
          type: "hero",
          data: {
            heading: "A Uganda-born, community-led NGO.",
            subheading: "We invest where it matters most: youth, health, and climate resilience.",
            ...(aboutHero ? { imageMediaId: aboutHero } : {}),
          },
        },
        {
          id: "p-about-text",
          type: "richText",
          data: {
            html: `<p>${BRAND_NAME} was founded to bring reproductive health, climate-resilience, and youth-empowerment services directly to the communities that need them most. We partner with local leaders, health facilities, and youth advocates to design programs that are practical, measurable, and durable.</p>`,
          },
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      seoDesc: `Get in touch with the ${BRAND_NAME} team.`,
      blocks: [
        {
          id: "p-contact-text",
          type: "richText",
          data: {
            html: `<p>We'd love to hear from you. Reach out at <a href="mailto:${SEED_ADMIN_EMAIL}">${SEED_ADMIN_EMAIL}</a>.</p>`,
          },
        },
      ],
    },
  ];
  for (const p of pages) {
    await db.page.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        seoDesc: p.seoDesc,
        blocks: p.blocks as never,
        status: "PUBLISHED",
      },
      create: {
        slug: p.slug,
        title: p.title,
        seoDesc: p.seoDesc,
        blocks: p.blocks as never,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }
}

async function seedDemoPrograms(media: Record<string, SeededMedia>) {
  const programs = [
    {
      slug: "youth-empowerment",
      title: "Youth Empowerment",
      summary:
        "Mentorship, skills training, and economic opportunity for Uganda's next generation.",
      coverKey: "hero-youth",
      order: 0,
    },
    {
      slug: "climate-resilience",
      title: "Climate Resilience",
      summary:
        "Community-led adaptation to climate shocks — seeds, water, and early-warning systems.",
      coverKey: "hero-climate",
      order: 1,
    },
    {
      slug: "health-outreach",
      title: "Health Outreach",
      summary:
        "Mobile clinics, reproductive health services, and referrals across rural districts.",
      coverKey: "hero-field",
      order: 2,
    },
    {
      slug: "community-radio",
      title: "Community Radio",
      summary: "Hyper-local broadcasting in six languages reaching 2M+ listeners weekly.",
      coverKey: "hero-radio",
      order: 3,
    },
  ];

  for (const p of programs) {
    const cover = media[p.coverKey];
    await db.program.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        body: [
          {
            id: `${p.slug}-body`,
            type: "richText",
            data: {
              html: `<p>${p.summary}</p><p>This program is active in multiple districts. Contact us to learn how to partner.</p>`,
            },
          },
        ] as never,
        coverMediaId: cover?.id,
        order: p.order,
        status: "PUBLISHED",
      },
    });
  }
}

async function seedDemoPosts(adminId: string, media: Record<string, SeededMedia>) {
  const posts = [
    {
      slug: "welcome-to-gloford",
      title: "Welcome to the new Gloford platform",
      excerpt: "A faster, more transparent way to follow our work.",
      coverKey: "hero-staff",
      body: "<p>We've rebuilt gloford.org from the ground up. Expect monthly program updates, financial transparency reports, and stories from the field.</p>",
    },
    {
      slug: "q1-impact-report",
      title: "Q1 impact report: 12,400 lives touched",
      excerpt: "Our latest numbers across the four programs.",
      coverKey: "hero-field",
      body: "<p>This quarter we reached 12,400 beneficiaries across youth, health, climate, and radio programs. Full report inside.</p>",
    },
  ];

  for (const p of posts) {
    const cover = media[p.coverKey];
    await db.post.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        body: [
          { id: `${p.slug}-body`, type: "richText", data: { html: p.body } },
        ] as never,
        coverMediaId: cover?.id,
        authorId: adminId,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }
}

async function seedDemoCampaign() {
  await db.campaign.upsert({
    where: { slug: "climate-resilience-2026" },
    update: {},
    create: {
      slug: "climate-resilience-2026",
      title: "Climate resilience drive — 2026",
      description:
        "Help us distribute drought-resistant seed and water harvesting kits to 1,000 farming households before the dry season.",
      goalCents: 500_000_00,
      currency: "USD",
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });
}

async function seedDemoEvent(media: Record<string, SeededMedia>) {
  const cover = media["hero-community"];
  await db.event.upsert({
    where: { slug: "annual-community-gathering-2026" },
    update: {},
    create: {
      slug: "annual-community-gathering-2026",
      title: "Annual community gathering",
      description:
        "Our annual meeting with community partners, donors, and staff. Open to the public.",
      startsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      location: "Kampala Serena Hotel",
      coverMediaId: cover?.id,
      isPublic: true,
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────

function hexToRgbTriplet(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m || !m[1]) return null;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `${r} ${g} ${b}`;
}

// Keep unused import from breaking the build.
void readFile;

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
