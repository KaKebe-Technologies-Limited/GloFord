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

  const headerItems = [
    { id: "seed-header-home", label: "Home", href: "/", order: 0, children: [] },
    {
      id: "seed-header-about-us",
      label: "About Us",
      href: "/about",
      order: 1,
      children: [
        { id: "seed-header-about-us-who-we-are", label: "Who We Are", href: "/who-we-are", order: 0 },
        { id: "seed-header-about-us-leadership", label: "Leadership", href: "/leadership", order: 1 },
        { id: "seed-header-about-us-our-history", label: "Our History", href: "/history", order: 2 },
        { id: "seed-header-about-us-partners", label: "Partners", href: "/partners", order: 3 },
      ],
    },
    {
      id: "seed-header-mission-impact",
      label: "Mission & Impact",
      href: "/mission",
      order: 2,
      children: [
        { id: "seed-header-mission-impact-our-mission", label: "Our Mission", href: "/mission", order: 0 },
        { id: "seed-header-mission-impact-our-approach", label: "Our Approach", href: "/our-approach", order: 1 },
        { id: "seed-header-mission-impact-impact-stories", label: "Impact Stories", href: "/blog", order: 2 },
        { id: "seed-header-mission-impact-reports-accountability", label: "Reports & Accountability", href: "/reports", order: 3 },
      ],
    },
    { id: "seed-header-programs", label: "Programs", href: "/programs", order: 3, children: [] },
    {
      id: "seed-header-get-involved",
      label: "Get Involved",
      href: "/volunteer",
      order: 4,
      children: [
        { id: "seed-header-get-involved-donate", label: "Donate", href: "/donate", order: 0 },
        { id: "seed-header-get-involved-volunteer", label: "Volunteer", href: "/volunteer", order: 1 },
        { id: "seed-header-get-involved-careers", label: "Careers", href: "/careers", order: 2 },
        { id: "seed-header-get-involved-internships", label: "Internships", href: "/internships", order: 3 },
        { id: "seed-header-get-involved-partner-with-us", label: "Partner With Us", href: "/partner-with-us", order: 4 },
      ],
    },
    {
      id: "seed-header-media",
      label: "Media",
      href: "/blog",
      order: 5,
      children: [
        { id: "seed-header-media-blog", label: "Blog", href: "/blog", order: 0 },
        { id: "seed-header-media-events", label: "Events", href: "/events", order: 1 },
        { id: "seed-header-media-newsroom", label: "Newsroom", href: "/newsroom", order: 2 },
        { id: "seed-header-media-gallery", label: "Gallery", href: "/gallery", order: 3 },
      ],
    },
    { id: "seed-header-contact", label: "Contact", href: "/contact", order: 6, children: [] },
  ] as const;

  for (const item of headerItems) {
    const parent = await db.navItem.upsert({
      where: { id: item.id },
      update: { location: "HEADER", parentId: null, label: item.label, href: item.href, order: item.order, isActive: true },
      create: { id: item.id, location: "HEADER", label: item.label, href: item.href, order: item.order, isActive: true },
    });

    for (const child of item.children) {
      await db.navItem.upsert({
        where: { id: child.id },
        update: { location: "HEADER", parentId: parent.id, label: child.label, href: child.href, order: child.order, isActive: true },
        create: { id: child.id, location: "HEADER", parentId: parent.id, label: child.label, href: child.href, order: child.order, isActive: true },
      });
    }
  }

  const footerItems = [
    { id: "seed-footer-about-us", label: "About Us", href: "/about", order: 0 },
    { id: "seed-footer-programs", label: "Programs", href: "/programs", order: 1 },
    { id: "seed-footer-volunteer", label: "Volunteer", href: "/volunteer", order: 2 },
    { id: "seed-footer-careers", label: "Careers", href: "/careers", order: 3 },
    { id: "seed-footer-contact", label: "Contact", href: "/contact", order: 4 },
  ] as const;

  for (const item of footerItems) {
    await db.navItem.upsert({
      where: { id: item.id },
      update: { location: "FOOTER", parentId: null, label: item.label, href: item.href, order: item.order, isActive: true },
      create: { id: item.id, location: "FOOTER", label: item.label, href: item.href, order: item.order, isActive: true },
    });
  }

  await db.navItem.updateMany({
    where: {
      location: "HEADER",
      id: { notIn: headerItems.flatMap((item) => [item.id, ...item.children.map((child) => child.id)]) },
      label: { in: ["Home", "About", "Programs", "Blog", "Events", "Contact"] },
    },
    data: { isActive: false },
  });

  await db.navItem.updateMany({
    where: {
      location: "FOOTER",
      id: { notIn: footerItems.map((item) => item.id) },
      label: { in: ["About", "Programs", "Blog", "Events", "Contact"] },
    },
    data: { isActive: false },
  });

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
  const youthHero = media["hero-youth"]?.id;
  const staffHero = media["hero-staff"]?.id;
  const partnerLogos = [
    media["partner-pepfar"]?.id,
    media["partner-plan"]?.id,
    media["partner-wood-en-daad"]?.id,
    media["partner-cehurd"]?.id,
  ].filter(Boolean) as string[];

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
            eyebrow: "Community-led development across Uganda",
            heading: "Building healthier, stronger, opportunity-rich communities together.",
            subheading:
              `${BRAND_NAME} partners with local leaders, families, and young people to expand access to health, education, livelihoods, and climate resilience with dignity and measurable impact.`,
            ctaLabel: "Donate now",
            ctaHref: "/donate",
            secondaryCtaLabel: "Volunteer with us",
            secondaryCtaHref: "/volunteer",
            ...(homeHero ? { imageMediaId: homeHero } : {}),
          },
        },
        {
          id: "p-home-mission",
          type: "featureSplit",
          data: {
            eyebrow: "Our mission",
            heading: "We turn community trust into practical action.",
            body:
              "Our work starts by listening. We co-design programs with communities, then back them with health outreach, youth mentorship, climate adaptation, and storytelling platforms that keep people informed and connected. The result is work that is local, accountable, and built to last.",
            ctaLabel: "Learn our approach",
            ctaHref: "/our-approach",
            ...(aboutHero ? { imageMediaId: aboutHero } : {}),
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
          data: {
            heading: "Programs rooted in real community needs",
            intro:
              "From youth opportunity to health outreach and climate resilience, each program is designed to solve practical problems with local partners.",
            limit: 4,
          },
        },
        {
          id: "p-home-feature",
          type: "featureSplit",
          data: {
            eyebrow: "Mission in action",
            heading: "When young people lead, communities move forward.",
            body:
              "We invest in youth leadership because transformation spreads outward. A confident young volunteer can become a mentor, an advocate, and a bridge between services and the families that need them most. That is the kind of multiplier effect we design for.",
            ctaLabel: "See volunteer opportunities",
            ctaHref: "/volunteer",
            ...(youthHero ? { imageMediaId: youthHero } : {}),
            reverse: true,
          },
        },
        {
          id: "p-home-actions",
          type: "actionCards",
          data: {
            heading: "Get involved in the mission",
            intro: "Different people contribute in different ways. Choose the path that fits your capacity and season.",
            items: [
              {
                title: "Volunteer",
                body: "Join local initiatives, campaigns, and field activities that directly support families and young people.",
                href: "/volunteer",
                label: "Start here",
              },
              {
                title: "Careers",
                body: "Bring your professional skills into mission-driven work with a team grounded in community partnership.",
                href: "/careers",
                label: "See openings",
              },
              {
                title: "Internships",
                body: "Learn alongside practitioners in programs, communications, research, and community mobilization.",
                href: "/internships",
                label: "Explore internships",
              },
              {
                title: "Partner with us",
                body: "Work with us as a donor, institution, implementing partner, or strategic ally.",
                href: "/partner-with-us",
                label: "Partner now",
              },
            ],
          },
        },
        {
          id: "p-home-donate",
          type: "donateCta",
          data: {
            heading: "Fund work that communities can feel right now.",
            body: "Support drought-resilient farming kits, mobile health outreach, youth mentorship, and local information access through community radio.",
            buttonLabel: "Support the campaign",
            campaignSlug: "climate-resilience-2026",
          },
        },
        {
          id: "p-home-posts",
          type: "postList",
          data: {
            heading: "Latest stories from the field",
            intro: "Stories, updates, and lessons from the communities we serve with.",
            limit: 3,
          },
        },
        {
          id: "p-home-events",
          type: "eventList",
          data: {
            heading: "Come meet the work in person",
            intro: "Join gatherings, public forums, and community events where ideas turn into action.",
            limit: 3,
          },
        },
        {
          id: "p-home-partners",
          type: "partnerLogos",
          data: {
            heading: "Built with trusted partners",
            intro: "We believe sustainable progress comes through collaboration across civil society, institutions, and communities.",
            mediaIds: partnerLogos,
          },
        },
        {
          id: "p-home-final-cta",
          type: "cta",
          data: {
            heading: "Ready to stand with communities shaping their own future?",
            body: "Explore the mission, join as a volunteer, or support the work financially.",
            buttonLabel: "Contact us",
            buttonHref: "/contact",
            variant: "outline",
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
    {
      slug: "who-we-are",
      title: "Who We Are",
      seoDesc: `${BRAND_NAME} is a community-led organization serving through partnership, dignity, and measurable action.`,
      blocks: [
        {
          id: "p-who-we-are-hero",
          type: "hero",
          data: {
            eyebrow: "About us",
            heading: "We exist to back communities with practical, respectful support.",
            subheading: "Our identity is rooted in partnership, trust, and work that responds to real conditions on the ground.",
            ...(staffHero ? { imageMediaId: staffHero } : {}),
          },
        },
      ],
    },
    {
      slug: "mission",
      title: "Our Mission",
      seoDesc: "Our mission and the impact we aim to make alongside communities.",
      blocks: [
        {
          id: "p-mission-feature",
          type: "featureSplit",
          data: {
            eyebrow: "Mission & impact",
            heading: "We help communities grow resilience, agency, and hope.",
            body: "Our mission is to strengthen people and systems so families can access opportunity, navigate crises, and participate in shaping their own future. We pursue that mission through practical service delivery, local leadership, and accountability to the communities we work with.",
            ...(aboutHero ? { imageMediaId: aboutHero } : {}),
          },
        },
      ],
    },
    {
      slug: "our-approach",
      title: "Our Approach",
      seoDesc: "How we design, deliver, and measure community-led work.",
      blocks: [
        {
          id: "p-approach-rich-text",
          type: "richText",
          data: {
            html: "<p>We listen first, build with local actors, measure what matters, and adapt quickly when conditions change. Our approach combines service, partnership, and storytelling so communities are not just recipients of aid but co-owners of solutions.</p>",
          },
        },
      ],
    },
    {
      slug: "leadership",
      title: "Leadership",
      seoDesc: "Meet the leadership guiding the organization.",
      blocks: [
        {
          id: "p-leadership-rich-text",
          type: "richText",
          data: {
            html: "<p>Our leadership team combines local insight, operational discipline, and a long-term commitment to the communities we serve. They guide strategy, stewardship, and accountability across all areas of work.</p>",
          },
        },
      ],
    },
    {
      slug: "history",
      title: "Our History",
      seoDesc: "A brief history of the organization and how the work evolved.",
      blocks: [
        {
          id: "p-history-rich-text",
          type: "richText",
          data: {
            html: `<p>${BRAND_NAME} began with a belief that sustainable progress requires local trust and long-term presence. What started as grassroots community support grew into a broader platform for health, youth empowerment, climate resilience, and communication.</p>`,
          },
        },
      ],
    },
    {
      slug: "partners",
      title: "Partners",
      seoDesc: "Organizations and institutions collaborating with us.",
      blocks: [
        {
          id: "p-partners-logos",
          type: "partnerLogos",
          data: {
            heading: "Partner ecosystem",
            intro: "These organizations help strengthen the reach and quality of the work.",
            mediaIds: partnerLogos,
          },
        },
      ],
    },
    {
      slug: "reports",
      title: "Reports & Accountability",
      seoDesc: "Transparency, reporting, and accountability resources.",
      blocks: [
        {
          id: "p-reports-rich-text",
          type: "richText",
          data: {
            html: "<p>We are committed to stewardship, transparency, and learning. This page is where annual reports, summaries, and accountability updates can be published for partners, supporters, and the communities we serve.</p>",
          },
        },
      ],
    },
    {
      slug: "volunteer",
      title: "Volunteer",
      seoDesc: "Volunteer opportunities and ways to serve.",
      blocks: [
        {
          id: "p-volunteer-hero",
          type: "hero",
          data: {
            eyebrow: "Get involved",
            heading: "Volunteer your time where it matters.",
            subheading: "Support campaigns, outreach, events, and community engagement with a team that values preparation and dignity.",
            ctaLabel: "Contact our team",
            ctaHref: "/contact",
            ...(youthHero ? { imageMediaId: youthHero } : {}),
          },
        },
      ],
    },
    {
      slug: "careers",
      title: "Careers",
      seoDesc: "Career opportunities and mission-driven roles.",
      blocks: [
        {
          id: "p-careers-hero",
          type: "hero",
          data: {
            eyebrow: "Careers",
            heading: "Build a career around meaningful community impact.",
            subheading: "Join a team that values collaboration, practical execution, and deep local partnership.",
            ctaLabel: "Ask about openings",
            ctaHref: "/contact",
            ...(staffHero ? { imageMediaId: staffHero } : {}),
          },
        },
      ],
    },
    {
      slug: "internships",
      title: "Internships",
      seoDesc: "Internship opportunities for emerging professionals.",
      blocks: [
        {
          id: "p-internships-rich-text",
          type: "richText",
          data: {
            html: "<p>Our internships are designed for emerging professionals who want real exposure to community work, communications, operations, and program delivery. We look for curiosity, humility, and a willingness to learn.</p>",
          },
        },
      ],
    },
    {
      slug: "partner-with-us",
      title: "Partner With Us",
      seoDesc: "Collaborate with us as an institution, donor, or implementation partner.",
      blocks: [
        {
          id: "p-partner-with-us-rich-text",
          type: "richText",
          data: {
            html: "<p>We welcome partnerships with donors, NGOs, institutions, local governments, and private sector actors who want to support scalable, community-grounded work. Reach out to explore strategic collaboration.</p>",
          },
        },
      ],
    },
    {
      slug: "newsroom",
      title: "Newsroom",
      seoDesc: "Press-ready updates, organizational highlights, and public announcements.",
      blocks: [
        {
          id: "p-newsroom-rich-text",
          type: "richText",
          data: {
            html: "<p>The newsroom is where public statements, press resources, and organization-wide announcements can be published.</p>",
          },
        },
      ],
    },
    {
      slug: "gallery",
      title: "Gallery",
      seoDesc: "Moments from field work, events, and community activities.",
      blocks: [
        {
          id: "p-gallery-grid",
          type: "gallery",
          data: {
            heading: "Field moments",
            mediaIds: [homeHero, aboutHero, youthHero, staffHero].filter(Boolean),
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
