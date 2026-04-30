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
const BRAND_PRIMARY_COLOR = process.env.BRAND_PRIMARY_COLOR ?? "#1a3c34";
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@gloford.org";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
if (!SEED_ADMIN_PASSWORD) {
  throw new Error("SEED_ADMIN_PASSWORD env var is required. Set it before running the seed.");
}
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

  console.log("→ Seeding hero slides, testimonials, stats, leader messages, team, careers, FAQs, volunteer…");
  await seedHeroSlides();
  await seedTestimonials();
  await seedSiteStats();
  await seedLeaderMessages();
  await seedTeamMembers();
  await seedCareers();
  await seedFaqs();
  await seedVolunteerOpportunities();

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

  const primaryRgb = hexToRgbTriplet(BRAND_PRIMARY_COLOR) ?? "26 60 52";

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
    { id: "h-home", label: "Home", href: "/", order: 0, children: [] },
    {
      id: "h-about",
      label: "About",
      href: "/who-we-are",
      order: 1,
      children: [
        { id: "h-about-who", label: "Who We Are", href: "/who-we-are", order: 0 },
        { id: "h-about-lead", label: "Leadership", href: "/leadership", order: 1 },
        { id: "h-about-hist", label: "Our History", href: "/history", order: 2 },
        { id: "h-about-part", label: "Partners", href: "/partners", order: 3 },
      ],
    },
    {
      id: "h-work",
      label: "Our Work",
      href: "/programs",
      order: 2,
      children: [
        { id: "h-work-approach", label: "Our Approach", href: "/our-approach", order: 0 },
        { id: "h-work-impact", label: "Impact Stories", href: "/impact-stories", order: 1 },
        { id: "h-work-reports", label: "Reports", href: "/reports", order: 2 },
      ],
    },
    { id: "h-programs", label: "Programs", href: "/programs", order: 3, children: [] },
    { id: "h-blog", label: "Blog", href: "/blog", order: 4, children: [] },
    {
      id: "h-involved",
      label: "Get Involved",
      href: "/get-involved",
      order: 5,
      children: [
        { id: "h-inv-vol", label: "Volunteer", href: "/volunteer", order: 0 },
        { id: "h-inv-car", label: "Careers", href: "/careers", order: 1 },
        { id: "h-inv-int", label: "Internships", href: "/internships", order: 2 },
        { id: "h-inv-par", label: "Partner With Us", href: "/partner-with-us", order: 3 },
        { id: "h-inv-don", label: "Donate", href: "/donate", order: 4 },
      ],
    },
    {
      id: "h-media",
      label: "Media",
      href: "/events",
      order: 6,
      children: [
        { id: "h-med-evt", label: "Events", href: "/events", order: 0 },
        { id: "h-med-press", label: "Press & Media", href: "/press", order: 1 },
        { id: "h-med-gal", label: "Gallery", href: "/gallery", order: 2 },
      ],
    },
    { id: "h-contact", label: "Contact", href: "/contact", order: 7, children: [] },
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

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD!, 10);
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
  await seedDemoEvents(mediaMap);
  await seedTeamPages(mediaMap);
  await seedPartnerPages(mediaMap);
  await seedReportPages();
  await seedImpactStoryPages(mediaMap);
}

/**
 * Register the /public/seed-images/* files as Media rows. We don't
 * upload them anywhere — they're served directly by Next's /public/
 * static handler. In production with R2 enabled, admins re-upload via
 * the admin UI; the seed stays a dev convenience.
 */
async function seedStockMedia(adminId: string): Promise<Record<string, SeededMedia>> {
  const map: Record<string, SeededMedia> = {};
  const publicRoot = path.resolve(process.cwd(), "public", "seed-images");

  for (const img of GLOFORD_IMAGES) {
    // Validate the file key contains no path traversal (CWE-22)
    if (img.file.includes("..") || path.isAbsolute(img.file)) continue;
    const diskPath = path.resolve(publicRoot, img.file);
    if (!diskPath.startsWith(publicRoot + path.sep)) continue;
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
  const climateHero = media["hero-climate"]?.id;
  const radioHero = media["hero-radio"]?.id;
  const internHero = media["hero-intern"]?.id;
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
        {
          id: "p-who-we-are-body",
          type: "richText",
          data: {
            html: `<h2>Our Story</h2>
<p>${BRAND_NAME} was born from a simple but powerful conviction: that communities already possess the insight, resilience, and social capital needed to drive their own transformation — they simply need partners willing to listen, invest, and stay. What began in 2009 as a grassroots health outreach initiative in rural eastern Uganda has evolved into a multi-program development organization reaching over 120,000 people across 14 districts.</p>

<p>Our founder, Dr. Isaac Mukasa, started the organization after witnessing firsthand how top-down aid programs routinely failed to account for local realities — cultural norms around reproductive health, seasonal farming pressures, the politics of water access, and the social dynamics that determine whether a community health worker is trusted or ignored. He believed that development work must be co-owned by the communities it serves, not imposed from outside. That founding principle still guides every program we design and deliver today.</p>

<h2>What We Do</h2>
<p>${BRAND_NAME} operates four core programs: <strong>Youth Empowerment</strong>, <strong>Climate Resilience</strong>, <strong>Health Outreach</strong>, and <strong>Community Radio</strong>. Each program was developed in direct response to needs identified through community consultations, baseline surveys, and years of on-the-ground presence. We do not parachute into a district for a six-month project cycle; we build relationships over years, embed staff locally, and iterate programs based on real feedback from the people we serve.</p>

<p>Our <strong>Youth Empowerment</strong> program provides mentorship, skills training, and seed capital to young people between the ages of 15 and 30. In a country where over 75% of the population is under 30 and youth unemployment exceeds 13%, we believe that investing in young people is the single highest-leverage intervention for long-term community transformation. Our youth graduates have gone on to start businesses, lead health campaigns, and serve as peer educators in their own villages.</p>

<p>Our <strong>Climate Resilience</strong> program works with smallholder farming families to adopt drought-resistant crop varieties, build rainwater harvesting systems, and participate in early-warning networks that help communities prepare for extreme weather events. Uganda's agricultural sector — which employs over 70% of the population — is among the most climate-vulnerable in East Africa. We partner with local agricultural extension officers and research institutions to deliver solutions that are affordable, practical, and culturally appropriate.</p>

<p>The <strong>Health Outreach</strong> program deploys mobile clinics, community health workers, and referral coordinators across underserved rural districts. Our focus areas include reproductive and maternal health, HIV/AIDS testing and counseling, malaria prevention, and nutrition education. We work closely with government health facilities to strengthen — not replace — the public health infrastructure. Last year alone, our mobile clinics conducted over 18,000 consultations and facilitated 2,400 referrals to district hospitals.</p>

<p>Our <strong>Community Radio</strong> program operates a hyper-local broadcasting platform that reaches over 2 million listeners weekly across six local languages. The station serves as an information lifeline for communities with limited internet access, providing health advisories, agricultural market updates, civic education programming, and a platform for community voices to be heard. During the COVID-19 pandemic, our radio broadcasts were the primary source of public health information for many rural households.</p>

<h2>How We Work</h2>
<p>We operate on three principles that distinguish our approach from conventional development organizations:</p>

<p><strong>Community co-design:</strong> Every program begins with extensive community consultations. We do not arrive with pre-packaged solutions. Instead, we facilitate structured dialogues with community leaders, women's groups, youth representatives, and local government officials to identify priorities, map existing resources, and co-design interventions that fit the local context. This process takes time — sometimes months — but it produces programs that communities feel ownership over and are willing to sustain.</p>

<p><strong>Local staffing and leadership:</strong> Over 90% of our staff are from the communities we serve. We invest heavily in recruiting, training, and retaining local talent because we believe that sustainable development requires local leadership. Our community health workers, agricultural trainers, radio presenters, and youth mentors are not outsiders delivering services — they are neighbors, friends, and trusted members of the community. This dramatically increases trust, compliance, and long-term impact.</p>

<p><strong>Accountability and transparency:</strong> We publish annual reports, financial audits, and program impact assessments for all stakeholders — including the communities we serve. We believe that accountability is not just a donor requirement but a moral obligation. Every shilling we receive is tracked, reported, and tied to measurable outcomes. Our board of directors includes community representatives who have direct oversight of our operations and finances.</p>

<h2>Our Values</h2>
<p>We are guided by five core values that shape every decision, hire, and partnership we make:</p>
<ul>
<li><strong>Dignity:</strong> Every person we serve is a partner, not a beneficiary. We design programs that respect agency, culture, and choice.</li>
<li><strong>Accountability:</strong> We owe honest reporting to communities, donors, and staff. Transparency is non-negotiable.</li>
<li><strong>Resilience:</strong> We build for the long term. Quick wins matter less than sustainable systems that outlast our presence.</li>
<li><strong>Collaboration:</strong> No single organization can solve systemic challenges alone. We actively seek partnerships that multiply impact.</li>
<li><strong>Learning:</strong> We measure, reflect, and adapt. When something does not work, we change it — publicly and without defensiveness.</li>
</ul>

<h2>Where We Work</h2>
<p>${BRAND_NAME} operates across 14 districts in eastern, central, and northern Uganda, with our headquarters in Kampala and field offices in Jinja, Soroti, and Gulu. Our geographic reach has grown steadily since our founding, driven not by institutional ambition but by community demand — each new district entered was a response to direct requests from local leaders who had seen our work in neighboring areas and wanted the same support for their own communities.</p>

<p>We are registered as a non-governmental organization with the Uganda National NGO Bureau, and we maintain active partnerships with the Ministry of Health, the Ministry of Agriculture, and several district local governments. Internationally, we collaborate with PEPFAR, Plan International, Wood-en-Daad, CEHURD, and a growing network of institutional and individual donors who share our vision of community-led development.</p>`,
          },
        },
        {
          id: "p-who-we-are-stats",
          type: "stats",
          data: {
            heading: "By the numbers",
            items: [
              { label: "Founded", value: "2009" },
              { label: "Staff members", value: "85+" },
              { label: "Districts reached", value: "14" },
              { label: "Annual beneficiaries", value: "120k+" },
            ],
          },
        },
        {
          id: "p-who-we-are-team-cta",
          type: "cta",
          data: {
            heading: "Meet the people behind the work",
            body: "Our leadership team combines decades of community development experience with deep local knowledge.",
            buttonLabel: "View leadership",
            buttonHref: "/leadership",
            variant: "primary" as const,
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
        {
          id: "p-mission-body",
          type: "richText",
          data: {
            html: `<h2>Mission Statement</h2>
<p>${BRAND_NAME} exists to empower communities in Uganda through sustainable, locally-led programs in health, youth development, climate resilience, and information access. We work alongside families, young people, and local leaders to build systems that are practical, accountable, and designed to outlast our direct involvement.</p>

<h2>Our Theory of Change</h2>
<p>We believe that when communities have access to quality health services, when young people have pathways to economic opportunity, when farming families can adapt to climate shocks, and when people have access to reliable local information — transformation follows naturally. Our role is to catalyze these conditions through partnership, investment, and sustained presence.</p>

<p>Each of our four programs addresses a different dimension of community wellbeing, but they are designed to reinforce each other. A young person who completes our mentorship program may go on to serve as a community health worker. A farming family that adopts drought-resistant crops through our climate program gains the food security that allows their children to stay in school. A radio broadcast about maternal health reaches women who then attend our mobile clinics. These interconnections are not accidental — they are the architecture of lasting change.</p>`,
          },
        },
        {
          id: "p-mission-impact-stories",
          type: "pageCollection",
          data: {
            heading: "Stories of impact",
            intro: "See how our mission translates into real lives changed.",
            collection: "impactStory",
            limit: 3,
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
          id: "p-approach-hero",
          type: "hero",
          data: {
            eyebrow: "How we work",
            heading: "Community-first, evidence-driven, built to last.",
            subheading: "We listen first, build with local actors, measure what matters, and adapt quickly when conditions change.",
            ...(aboutHero ? { imageMediaId: aboutHero } : {}),
          },
        },
        {
          id: "p-approach-rich-text",
          type: "richText",
          data: {
            html: `<h2>Our Development Philosophy</h2>
<p>Too many development programs fail because they are designed in offices far from the communities they aim to serve. We take a fundamentally different approach. Every program we operate was co-designed with the communities it serves, and every intervention is continuously refined based on feedback from the people closest to the work.</p>

<h3>Phase 1: Listen and Learn</h3>
<p>Before launching any program in a new district, we spend three to six months conducting community consultations, baseline surveys, and stakeholder mapping. We meet with village leaders, women's groups, youth representatives, health facility staff, and local government officials. We ask what they see as their greatest challenges, what resources they already have, and what kind of support would make the biggest difference. This process is slow by design — it builds the trust and shared understanding that make programs sustainable.</p>

<h3>Phase 2: Co-Design and Pilot</h3>
<p>Based on community input, we co-design program interventions with local stakeholders. We pilot new approaches on a small scale, measure results rigorously, and iterate before expanding. This protects communities from untested ideas and ensures that what we scale has already been validated in real conditions.</p>

<h3>Phase 3: Deliver and Measure</h3>
<p>Once a program model has been validated, we scale it across target communities with full staffing, monitoring systems, and accountability mechanisms. Every program has clear outcome indicators, data collection protocols, and regular review cycles. We publish program results in our annual reports and share them with communities in accessible formats.</p>

<h3>Phase 4: Transition and Sustain</h3>
<p>Our goal is not to create permanent dependence on external support. From the beginning, we invest in local capacity — training community health workers, equipping youth mentors, strengthening farmer cooperatives, and building institutional partnerships that can sustain services after our direct involvement ends. In three districts, our health outreach programs have been fully transitioned to local management with ongoing technical support from our team.</p>`,
          },
        },
        {
          id: "p-approach-stats",
          type: "stats",
          data: {
            heading: "Approach in numbers",
            items: [
              { label: "Community consultations", value: "240+" },
              { label: "Local staff", value: "90%" },
              { label: "Programs transitioned", value: "3" },
              { label: "Partner organizations", value: "40+" },
            ],
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
          id: "p-leadership-hero",
          type: "hero",
          data: {
            heading: "Led by people who know the work from the inside.",
            subheading: "Our leadership team combines decades of community development experience with deep local knowledge and operational discipline.",
            ...(staffHero ? { imageMediaId: staffHero } : {}),
          },
        },
        {
          id: "p-leadership-team-grid",
          type: "pageCollection",
          data: {
            heading: "Our team",
            intro: "Click on any team member to learn about their background, role, and vision.",
            collection: "team",
            limit: 12,
          },
        },
      ],
    },
    {
      slug: "history",
      title: "Our History",
      seoDesc: "A timeline of the organization's growth from grassroots beginnings to a multi-program platform.",
      blocks: [
        {
          id: "p-history-hero",
          type: "hero",
          data: {
            heading: "From grassroots to 14 districts — and still growing.",
            subheading: "Our journey began with a single health outreach camp in Jinja district. Today we reach over 120,000 people annually.",
            ...(aboutHero ? { imageMediaId: aboutHero } : {}),
          },
        },
        {
          id: "p-history-rich-text",
          type: "richText",
          data: {
            html: `<h2>2009 — The Beginning</h2>
<p>${BRAND_NAME} was founded by Dr. Isaac Mukasa in Jinja district, eastern Uganda. The first program was a mobile reproductive health clinic that visited five villages on a rotating weekly schedule. With a team of just three community health workers and a borrowed vehicle, the clinic served 800 people in its first year.</p>

<h2>2011 — Youth Program Launched</h2>
<p>Recognizing that health outcomes were deeply connected to economic opportunity, we launched our first youth mentorship cohort. Twelve young people from Jinja completed a six-month program combining life skills, financial literacy, and vocational training. Eight of them started small businesses within a year.</p>

<h2>2013 — Expansion to Soroti</h2>
<p>Community leaders in Soroti district invited us to replicate our health outreach model in their area. This was the first time our work expanded beyond Jinja — driven not by institutional ambition but by community demand. We established our second field office and hired 15 local staff.</p>

<h2>2015 — Community Radio Goes Live</h2>
<p>We launched our community radio station, broadcasting in six local languages across eastern Uganda. The station quickly became a lifeline for communities with limited internet access, providing health advisories, agricultural market prices, civic education, and a platform for community dialogue. Listenership reached 500,000 within the first year.</p>

<h2>2017 — Climate Resilience Program</h2>
<p>After two consecutive seasons of drought devastated farming communities in our operational districts, we launched the Climate Resilience program. Working with agricultural research institutions, we distributed drought-resistant seed varieties, built rainwater harvesting systems, and established early-warning networks in 200 farming communities.</p>

<h2>2019 — Ten Years, Ten Districts</h2>
<p>By our tenth anniversary, ${BRAND_NAME} had grown to serve communities in ten districts across eastern and central Uganda. Our annual beneficiary count exceeded 80,000, and our team had grown to 60 staff members. We celebrated by publishing our first comprehensive impact report and hosting a community gathering attended by 500 people.</p>

<h2>2020 — COVID-19 Response</h2>
<p>When the pandemic hit, our community radio station became a critical public health communication channel. We adapted our mobile clinics to include COVID-19 screening and prevention education, and our youth program pivoted to digital skills training. Despite lockdowns and movement restrictions, we maintained service delivery in all operational districts.</p>

<h2>2022 — Northern Uganda Expansion</h2>
<p>We opened our Gulu field office, marking our entry into northern Uganda. The expansion was supported by a multi-year partnership with PEPFAR and brought our health outreach and youth programs to communities still recovering from decades of conflict.</p>

<h2>2024 — 14 Districts and Growing</h2>
<p>Today, ${BRAND_NAME} operates across 14 districts in eastern, central, and northern Uganda. Our team has grown to over 85 staff, our radio broadcasts reach over 2 million listeners weekly, and our programs have touched the lives of more than 120,000 people. We continue to grow — not for the sake of growth, but because communities keep asking us to show up.</p>`,
          },
        },
      ],
    },
    {
      slug: "partners",
      title: "Partners",
      seoDesc: "Organizations and institutions collaborating with us to strengthen communities.",
      blocks: [
        {
          id: "p-partners-intro",
          type: "richText",
          data: {
            html: `<h2>Our Partner Ecosystem</h2>
<p>Sustainable development is never a solo endeavor. ${BRAND_NAME} works with a network of institutional partners, government agencies, international organizations, and local civil society groups who bring complementary expertise, resources, and reach. Each partnership is built on shared values, clear accountability, and a commitment to community-led approaches.</p>`,
          },
        },
        {
          id: "p-partners-logos",
          type: "partnerLogos",
          data: {
            heading: "Trusted partners",
            intro: "These organizations support and strengthen our work across Uganda.",
            mediaIds: partnerLogos,
          },
        },
        {
          id: "p-partners-collection",
          type: "pageCollection",
          data: {
            heading: "Partner profiles",
            intro: "Learn about each partnership and how we work together.",
            collection: "partner",
            limit: 12,
          },
        },
      ],
    },
    {
      slug: "reports",
      title: "Reports & Accountability",
      seoDesc: "Transparency reports, annual summaries, and accountability documents.",
      blocks: [
        {
          id: "p-reports-intro",
          type: "richText",
          data: {
            html: `<h2>Transparency & Accountability</h2>
<p>We believe that every shilling entrusted to us deserves rigorous stewardship and honest reporting. Below you will find our annual reports, financial summaries, and impact assessments. These documents are shared with all stakeholders — including the communities we serve — because accountability is not just a donor requirement but a moral obligation.</p>
<p>Our board of directors includes community representatives with direct oversight of operations and finances. All reports are independently audited and publicly available.</p>`,
          },
        },
        {
          id: "p-reports-collection",
          type: "pageCollection",
          data: {
            heading: "Published reports",
            intro: "Download or read our full reports below.",
            collection: "report",
            limit: 12,
          },
        },
      ],
    },
    {
      slug: "volunteer",
      title: "Volunteer",
      seoDesc: "Volunteer opportunities and ways to serve alongside communities in Uganda.",
      blocks: [
        {
          id: "p-volunteer-hero",
          type: "hero",
          data: {
            eyebrow: "Get involved",
            heading: "Volunteer your time where it matters.",
            subheading: "Support campaigns, outreach, events, and community engagement with a team that values preparation and dignity.",
            ctaLabel: "Apply to volunteer",
            ctaHref: "/contact",
            ...(youthHero ? { imageMediaId: youthHero } : {}),
          },
        },
        {
          id: "p-volunteer-body",
          type: "richText",
          data: {
            html: `<h2>Why Volunteer With Us</h2>
<p>Volunteering with ${BRAND_NAME} is not a tourist experience — it is real work alongside real communities. We match volunteers with roles that use their skills where they are needed most, whether that is in the field, in our offices, or remotely. Every volunteer receives orientation, mentorship from a staff partner, and a clear scope of work.</p>

<h3>Current Volunteer Opportunities</h3>
<ul>
<li><strong>Community Health Outreach:</strong> Support our mobile clinics with logistics, patient registration, and health education sessions. Requires minimum 4-week commitment.</li>
<li><strong>Youth Mentorship:</strong> Serve as a mentor for young people in our empowerment program. Skills in business, technology, agriculture, or trades are especially valued.</li>
<li><strong>Communications & Media:</strong> Help document stories from the field, produce radio content, or manage our digital presence. Photography, writing, and video skills welcome.</li>
<li><strong>Events & Fundraising:</strong> Support community gatherings, donor events, and public awareness campaigns with planning and coordination.</li>
<li><strong>Data & Research:</strong> Assist with baseline surveys, monitoring and evaluation, and impact assessment. Graduate students and researchers welcome.</li>
</ul>

<h3>What We Expect</h3>
<p>We ask all volunteers to commit to a minimum engagement period, complete our orientation program, and respect the communities they serve. We do not accept volunteers who seek to impose their own agenda or who are unwilling to learn from local staff and community members. Humility, reliability, and a genuine desire to contribute are the only prerequisites.</p>`,
          },
        },
        {
          id: "p-volunteer-cta",
          type: "cta",
          data: {
            heading: "Ready to get started?",
            body: "Fill out our volunteer interest form and our coordination team will reach out within 5 working days.",
            buttonLabel: "Contact us",
            buttonHref: "/contact",
            variant: "primary" as const,
          },
        },
      ],
    },
    {
      slug: "careers",
      title: "Careers",
      seoDesc: "Career opportunities and mission-driven roles at a leading Ugandan NGO.",
      blocks: [
        {
          id: "p-careers-hero",
          type: "hero",
          data: {
            eyebrow: "Careers",
            heading: "Build a career around meaningful community impact.",
            subheading: "Join a team that values collaboration, practical execution, and deep local partnership.",
            ctaLabel: "See current openings",
            ctaHref: "/contact",
            ...(staffHero ? { imageMediaId: staffHero } : {}),
          },
        },
        {
          id: "p-careers-body",
          type: "richText",
          data: {
            html: `<h2>Working at ${BRAND_NAME}</h2>
<p>We are a team of 85+ staff working across 14 districts. Over 90% of our team members are from the communities we serve. We offer competitive compensation, professional development opportunities, and a work environment built on respect, accountability, and mission alignment.</p>

<h3>What We Look For</h3>
<p>We hire people who are passionate about community development, comfortable working in rural and under-resourced settings, and committed to the discipline that high-impact work requires. Technical skills matter, but character, humility, and cultural fluency matter more. We especially encourage applications from women, young professionals, and people with lived experience in the communities we serve.</p>

<h3>Current Openings</h3>
<p>We regularly recruit for the following types of roles:</p>
<ul>
<li><strong>Community Health Workers</strong> — Field-based roles in our health outreach program</li>
<li><strong>Youth Program Coordinators</strong> — Mentorship and skills training facilitation</li>
<li><strong>Agricultural Extension Officers</strong> — Climate resilience program delivery</li>
<li><strong>Radio Presenters & Producers</strong> — Content creation in local languages</li>
<li><strong>Monitoring & Evaluation Officers</strong> — Data collection and impact measurement</li>
<li><strong>Finance & Administration</strong> — Operations support at headquarters and field offices</li>
</ul>
<p>To inquire about current openings or submit your CV, contact us at <a href="mailto:careers@gloford.org">careers@gloford.org</a>.</p>`,
          },
        },
      ],
    },
    {
      slug: "internships",
      title: "Internships",
      seoDesc: "Internship opportunities for emerging professionals in community development.",
      blocks: [
        {
          id: "p-internships-hero",
          type: "hero",
          data: {
            eyebrow: "Internships",
            heading: "Learn by doing, alongside practitioners in the field.",
            subheading: "Our internships are designed for emerging professionals who want real exposure to community development work.",
            ...(youthHero ? { imageMediaId: youthHero } : {}),
          },
        },
        {
          id: "p-internships-rich-text",
          type: "richText",
          data: {
            html: `<h2>Internship Program</h2>
<p>Each year, ${BRAND_NAME} hosts 10-15 interns across our programs and departments. Interns work alongside experienced staff on real projects — not make-work assignments. Past interns have contributed to impact evaluations, produced radio documentaries, supported mobile clinic operations, and helped design community engagement strategies.</p>

<h3>Available Tracks</h3>
<ul>
<li><strong>Programs & Field Operations:</strong> Work directly with one of our four programs in a field setting. Ideal for students in public health, agriculture, social work, or development studies.</li>
<li><strong>Communications & Media:</strong> Support our radio station, digital content, photography, and storytelling. Great for journalism, media, and communications students.</li>
<li><strong>Research & M&E:</strong> Assist with data collection, analysis, and report writing. Suited for students in statistics, social sciences, or public policy.</li>
<li><strong>Operations & Finance:</strong> Support headquarters functions including procurement, HR, and financial reporting.</li>
</ul>

<h3>How to Apply</h3>
<p>We accept intern applications on a rolling basis. Internships typically last 3-6 months and begin with a two-week orientation. A small stipend and transport allowance are provided. Send your CV and a brief motivation letter to <a href="mailto:internships@gloford.org">internships@gloford.org</a>.</p>`,
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
          id: "p-partner-with-us-hero",
          type: "hero",
          data: {
            eyebrow: "Partnerships",
            heading: "Let us build something lasting — together.",
            subheading: "We welcome partnerships with donors, NGOs, institutions, governments, and private sector actors who share our values.",
            ...(aboutHero ? { imageMediaId: aboutHero } : {}),
          },
        },
        {
          id: "p-partner-with-us-rich-text",
          type: "richText",
          data: {
            html: `<h2>Partnership Opportunities</h2>
<p>${BRAND_NAME} actively seeks partnerships that multiply community impact. We have experience working with bilateral and multilateral donors, international NGOs, government ministries, academic institutions, and corporate foundations.</p>

<h3>Types of Partnerships</h3>
<ul>
<li><strong>Funding Partnerships:</strong> Support our programs through grants, sponsorships, or co-funding arrangements. We offer full transparency, regular reporting, and independent audits.</li>
<li><strong>Implementation Partnerships:</strong> Co-deliver programs in areas of shared expertise. We bring deep community access and local knowledge; you bring complementary technical capacity.</li>
<li><strong>Technical Assistance:</strong> Share specialized knowledge in areas like agricultural technology, digital health, media production, or organizational development.</li>
<li><strong>Research Partnerships:</strong> Collaborate on applied research, impact evaluations, or knowledge products that advance the field of community-led development.</li>
</ul>

<p>To discuss partnership opportunities, contact our partnerships team at <a href="mailto:partnerships@gloford.org">partnerships@gloford.org</a>.</p>`,
          },
        },
        {
          id: "p-partner-with-us-logos",
          type: "partnerLogos",
          data: {
            heading: "Current partners",
            intro: "We are proud to work alongside these organizations.",
            mediaIds: partnerLogos,
          },
        },
      ],
    },
    {
      slug: "gallery",
      title: "Gallery",
      seoDesc: "Photos from our field work, events, community activities, and programs.",
      blocks: [
        {
          id: "p-gallery-hero",
          type: "hero",
          data: {
            heading: "The work, in pictures.",
            subheading: "Moments from the field — community gatherings, health outreach, youth programs, and the people who make it all possible.",
          },
        },
        {
          id: "p-gallery-grid",
          type: "gallery",
          data: {
            heading: "Field moments",
            mediaIds: [homeHero, aboutHero, youthHero, staffHero, climateHero, radioHero, internHero].filter(Boolean),
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

async function seedDemoEvents(media: Record<string, SeededMedia>) {
  const DAY = 24 * 60 * 60 * 1000;
  const events = [
    {
      slug: "annual-community-gathering-2026",
      title: "Annual Community Gathering 2026",
      description: "Our flagship annual meeting bringing together community partners, donors, staff, and government representatives. Features program showcases, financial transparency presentations, and community voices panel. Open to the public.",
      startsAt: new Date(Date.now() + 30 * DAY),
      endsAt: new Date(Date.now() + 30 * DAY + 8 * 60 * 60 * 1000),
      location: "Kampala Serena Hotel, Kampala",
      coverKey: "hero-community",
    },
    {
      slug: "youth-leadership-summit-2026",
      title: "Youth Leadership Summit",
      description: "A two-day summit for young leaders from our empowerment program across all 14 districts. Workshops on entrepreneurship, civic engagement, digital skills, and peer mentorship. Keynote by the Minister of Youth and Children Affairs.",
      startsAt: new Date(Date.now() + 14 * DAY),
      endsAt: new Date(Date.now() + 15 * DAY),
      location: "Imperial Royale Hotel, Kampala",
      coverKey: "hero-youth",
    },
    {
      slug: "mobile-health-camp-jinja-june-2026",
      title: "Mobile Health Camp — Jinja District",
      description: "Free health screening including HIV testing, malaria rapid tests, blood pressure checks, maternal health consultations, and nutrition counseling. Bring your family. No appointment needed.",
      startsAt: new Date(Date.now() + 7 * DAY),
      endsAt: new Date(Date.now() + 7 * DAY + 6 * 60 * 60 * 1000),
      location: "Bugembe Town Council Grounds, Jinja",
      coverKey: "hero-field",
    },
    {
      slug: "climate-resilience-farmer-training-2026",
      title: "Farmer Training: Drought-Resistant Crops",
      description: "Hands-on training for smallholder farmers on drought-resistant seed varieties, water harvesting techniques, and soil conservation practices. Training materials and starter seed kits provided free of charge.",
      startsAt: new Date(Date.now() + 21 * DAY),
      endsAt: new Date(Date.now() + 21 * DAY + 5 * 60 * 60 * 1000),
      location: "Soroti Agricultural Training Centre, Soroti",
      coverKey: "hero-climate",
    },
    {
      slug: "community-radio-open-day-2026",
      title: "Community Radio Open Day",
      description: "Visit our radio station, meet the presenters, and learn how community radio serves as an information lifeline. Live broadcasts, interactive sessions, and a chance to share your community's stories on air.",
      startsAt: new Date(Date.now() + 45 * DAY),
      endsAt: new Date(Date.now() + 45 * DAY + 4 * 60 * 60 * 1000),
      location: "Gloford Radio Studios, Jinja",
      coverKey: "hero-radio",
    },
    {
      slug: "donor-appreciation-dinner-2026",
      title: "Donor Appreciation Dinner",
      description: "An evening of gratitude, impact storytelling, and forward-looking conversation with our funding partners. Includes a presentation of the 2025 annual report and a preview of 2027 strategic priorities.",
      startsAt: new Date(Date.now() + 60 * DAY),
      endsAt: new Date(Date.now() + 60 * DAY + 3 * 60 * 60 * 1000),
      location: "Sheraton Hotel, Kampala",
      coverKey: "hero-staff",
    },
  ];

  for (const e of events) {
    const cover = media[e.coverKey];
    await db.event.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        title: e.title,
        description: e.description,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        location: e.location,
        coverMediaId: cover?.id,
        isPublic: true,
      },
    });
  }
}

// ─── Collection pages: Team, Partners, Reports, Impact Stories ──

async function seedTeamPages(media: Record<string, SeededMedia>) {
  const ceoPhoto = media["people-ceo"]?.id;
  const chairmanPhoto = media["people-chairman"]?.id;
  const staffPhoto = media["hero-staff"]?.id;
  const youthPhoto = media["hero-youth"]?.id;
  const fieldPhoto = media["hero-field"]?.id;
  const radioPhoto = media["hero-radio"]?.id;

  const team = [
    {
      slug: "leadership-isaac-mukasa",
      title: "Dr. Isaac Mukasa",
      seoDesc: "Founder & Executive Director — leads organizational strategy, partnerships, and community engagement across all programs.",
      imageId: ceoPhoto,
      role: "Founder & Executive Director",
      bio: `<p>Dr. Isaac Mukasa founded ${BRAND_NAME} in 2009 after a career in public health research that took him across East Africa. He holds a PhD in Public Health from Makerere University and an MPH from the London School of Hygiene & Tropical Medicine.</p>
<p>Isaac's approach to development work was shaped by years of observing how top-down aid programs failed to account for local realities. He believed that communities already possessed the insight needed to drive their own transformation — they simply needed partners willing to listen, invest, and stay. That conviction became the founding principle of ${BRAND_NAME}.</p>
<p>Under Isaac's leadership, the organization has grown from a three-person mobile health clinic to a multi-program platform serving over 120,000 people across 14 districts. He oversees organizational strategy, major partnerships, and community relations, and he remains deeply involved in field operations.</p>
<p>Isaac serves on the advisory boards of the Uganda National Health Research Organization and the East African Health Alliance. He was named among Uganda's Top 40 Under 40 Social Innovators in 2018.</p>`,
    },
    {
      slug: "leadership-grace-nakato",
      title: "Grace Nakato",
      seoDesc: "Board Chairperson — provides governance oversight and strategic direction for the organization.",
      imageId: chairmanPhoto,
      role: "Board Chairperson",
      bio: `<p>Grace Nakato has chaired the ${BRAND_NAME} Board of Directors since 2017. She brings over 25 years of experience in international development, having served in senior roles at UNDP, UNICEF, and the African Development Bank.</p>
<p>Grace holds an MBA from INSEAD and a Bachelor's degree in Economics from the University of Nairobi. Her expertise spans organizational governance, public-private partnerships, and development finance.</p>
<p>As Board Chairperson, Grace ensures that the organization maintains the highest standards of governance, transparency, and strategic coherence. She leads the annual board review process, oversees the independent audit, and represents ${BRAND_NAME} in high-level policy forums.</p>
<p>Grace is passionate about women's economic empowerment and youth leadership. She serves on the boards of two other East African NGOs and mentors young women leaders through the African Women's Leadership Network.</p>`,
    },
    {
      slug: "leadership-samuel-opio",
      title: "Samuel Opio",
      seoDesc: "Director of Programs — oversees design, delivery, and evaluation of all four core programs.",
      imageId: staffPhoto,
      role: "Director of Programs",
      bio: `<p>Samuel Opio joined ${BRAND_NAME} in 2013 as a field coordinator in Soroti district and has risen through the ranks to become Director of Programs. He holds a Master's in Development Studies from the Institute of Social Studies (The Hague) and a Bachelor's in Social Work from Makerere University.</p>
<p>Samuel oversees the design, delivery, and evaluation of all four programs — Youth Empowerment, Climate Resilience, Health Outreach, and Community Radio. He leads a team of 12 program managers and coordinates operations across 14 districts.</p>
<p>Before joining ${BRAND_NAME}, Samuel spent five years as a community development officer with World Vision Uganda, working in post-conflict recovery programs in northern Uganda. This experience gave him a deep understanding of how community-led approaches can rebuild social cohesion and economic opportunity in the most challenging settings.</p>
<p>Samuel is known for his rigorous approach to monitoring and evaluation. He introduced the organization's current M&E framework, which tracks 47 outcome indicators across all programs and has been cited as a best practice by PEPFAR Uganda.</p>`,
    },
    {
      slug: "leadership-faith-among",
      title: "Faith Among",
      seoDesc: "Director of Health Programs — leads mobile clinics, maternal health, and community health worker training.",
      imageId: fieldPhoto,
      role: "Director of Health Programs",
      bio: `<p>Faith Among is a registered nurse and public health specialist who has led ${BRAND_NAME}'s Health Outreach program since 2016. She holds a Master's in Public Health from Mbarara University and a nursing diploma from Mulago School of Nursing.</p>
<p>Faith manages the organization's fleet of mobile clinics, a network of 45 community health workers, and partnerships with 22 government health facilities across operational districts. Under her leadership, the health program has conducted over 80,000 consultations and facilitated more than 12,000 referrals to district hospitals.</p>
<p>Her areas of focus include reproductive and maternal health, HIV/AIDS prevention and testing, and community-based nutrition interventions. Faith was instrumental in adapting the health program during COVID-19, integrating screening protocols and prevention messaging into routine mobile clinic operations.</p>
<p>Faith is a member of the Uganda Nurses and Midwives Council and regularly speaks at public health conferences on community-based service delivery models.</p>`,
    },
    {
      slug: "leadership-peter-otim",
      title: "Peter Otim",
      seoDesc: "Director of Finance & Administration — manages financial stewardship, compliance, and operational infrastructure.",
      imageId: youthPhoto,
      role: "Director of Finance & Administration",
      bio: `<p>Peter Otim brings over 15 years of financial management experience in the non-profit sector. He holds a CPA qualification and a Bachelor's in Commerce from Makerere University Business School. He joined ${BRAND_NAME} in 2015.</p>
<p>Peter oversees all financial operations, including budgeting, donor reporting, procurement, HR, and compliance. He manages relationships with external auditors and ensures that the organization meets the regulatory requirements of the Uganda National NGO Bureau and all funding partners.</p>
<p>Under Peter's stewardship, ${BRAND_NAME} has maintained clean audit opinions for eight consecutive years and has never had a compliance finding from any donor review. He introduced the organization's current financial management system and internal controls framework.</p>
<p>Peter is committed to making financial information accessible to all stakeholders. He leads the production of the annual financial report and presents financial results at the annual community gathering in plain, jargon-free language.</p>`,
    },
    {
      slug: "leadership-agnes-acen",
      title: "Agnes Acen",
      seoDesc: "Head of Communications & Community Radio — oversees media production, radio broadcasting, and public engagement.",
      imageId: radioPhoto,
      role: "Head of Communications & Community Radio",
      bio: `<p>Agnes Acen leads ${BRAND_NAME}'s communications function and manages the Community Radio program. She holds a Master's in Mass Communication from Makerere University and started her career as a radio journalist in Gulu, northern Uganda.</p>
<p>Agnes joined ${BRAND_NAME} in 2015 to help launch the community radio station. Under her leadership, the station now broadcasts in six local languages, reaches over 2 million listeners weekly, and produces original content on health, agriculture, civic education, and community development. The station's listener feedback shows a 78% trust rating — among the highest for any community media outlet in East Africa.</p>
<p>Beyond radio, Agnes oversees the organization's digital presence, media relations, and storytelling output. She has built a team of four content producers who document stories from the field and produce reports, videos, and social media content that make the organization's work visible to a wider audience.</p>
<p>Agnes was awarded the Uganda Media Women's Association Prize for Excellence in Community Journalism in 2021. She mentors young journalists and communication students through the organization's internship program.</p>`,
    },
  ];

  for (const member of team) {
    await db.page.upsert({
      where: { slug: member.slug },
      update: {
        title: member.title,
        seoDesc: member.seoDesc,
        blocks: [
          {
            id: `${member.slug}-hero`,
            type: "hero",
            data: {
              eyebrow: member.role,
              heading: member.title,
              subheading: member.seoDesc,
              ...(member.imageId ? { imageMediaId: member.imageId } : {}),
            },
          },
          {
            id: `${member.slug}-bio`,
            type: "richText",
            data: { html: member.bio },
          },
        ] as never,
        status: "PUBLISHED",
      },
      create: {
        slug: member.slug,
        title: member.title,
        seoDesc: member.seoDesc,
        blocks: [
          {
            id: `${member.slug}-hero`,
            type: "hero",
            data: {
              eyebrow: member.role,
              heading: member.title,
              subheading: member.seoDesc,
              ...(member.imageId ? { imageMediaId: member.imageId } : {}),
            },
          },
          {
            id: `${member.slug}-bio`,
            type: "richText",
            data: { html: member.bio },
          },
        ] as never,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }
}

async function seedPartnerPages(media: Record<string, SeededMedia>) {
  const partners = [
    {
      slug: "partner-pepfar",
      title: "PEPFAR (U.S. President's Emergency Plan for AIDS Relief)",
      seoDesc: "Multi-year partnership supporting HIV/AIDS prevention, testing, and treatment programs across northern and eastern Uganda.",
      logoKey: "partner-pepfar",
      body: `<h2>Partnership Overview</h2>
<p>PEPFAR has been one of ${BRAND_NAME}'s most significant funding partners since 2018. Through PEPFAR support, we have expanded our HIV/AIDS testing, prevention, and treatment referral services to seven additional districts in northern and eastern Uganda.</p>

<h3>Partnership Details</h3>
<ul>
<li><strong>Duration:</strong> 2018 — present (multi-year, renewable)</li>
<li><strong>Focus areas:</strong> HIV/AIDS testing and counseling, prevention of mother-to-child transmission (PMTCT), community-based adherence support, and health systems strengthening</li>
<li><strong>Geographic scope:</strong> Northern Uganda (Gulu, Lira, Kitgum) and Eastern Uganda (Jinja, Soroti, Mbale, Iganga)</li>
<li><strong>Key achievements:</strong> Over 45,000 HIV tests facilitated, 3,200 PMTCT referrals completed, 22 health facility partnerships established</li>
</ul>

<p>PEPFAR's support has enabled us to recruit and train 25 additional community health workers, procure rapid testing supplies, and establish a robust monitoring and evaluation system that tracks treatment outcomes across all service delivery points.</p>`,
    },
    {
      slug: "partner-plan-international",
      title: "Plan International",
      seoDesc: "Joint implementation of youth empowerment and child protection programs in eastern Uganda.",
      logoKey: "partner-plan",
      body: `<h2>Partnership Overview</h2>
<p>Plan International and ${BRAND_NAME} have partnered since 2016 on youth empowerment and child protection programming in eastern Uganda. The partnership leverages Plan International's global expertise in child rights and youth development with our deep community access and local implementation capacity.</p>

<h3>Partnership Details</h3>
<ul>
<li><strong>Duration:</strong> 2016 — present</li>
<li><strong>Focus areas:</strong> Youth economic empowerment, life skills training, child protection, and gender-responsive programming</li>
<li><strong>Geographic scope:</strong> Jinja, Iganga, and Kamuli districts</li>
<li><strong>Key achievements:</strong> 2,800 young people enrolled in mentorship programs, 450 youth-led businesses established, 12 community child protection committees trained and operational</li>
</ul>

<p>This partnership has been particularly impactful in reaching adolescent girls with economic skills and reproductive health information, helping to reduce early marriage and teen pregnancy rates in target communities.</p>`,
    },
    {
      slug: "partner-wood-en-daad",
      title: "Woord en Daad (Word & Deed)",
      seoDesc: "Partnership on climate resilience and sustainable livelihoods for smallholder farming families.",
      logoKey: "partner-wood-en-daad",
      body: `<h2>Partnership Overview</h2>
<p>Woord en Daad, a Netherlands-based development organization, has supported ${BRAND_NAME}'s climate resilience work since 2019. The partnership focuses on building sustainable livelihoods for smallholder farming families facing increasing climate vulnerability.</p>

<h3>Partnership Details</h3>
<ul>
<li><strong>Duration:</strong> 2019 — present</li>
<li><strong>Focus areas:</strong> Drought-resistant agriculture, water harvesting, farmer cooperative development, and market linkages</li>
<li><strong>Geographic scope:</strong> Soroti, Kumi, and Ngora districts (Teso sub-region)</li>
<li><strong>Key achievements:</strong> 1,200 farming households reached with drought-resistant seed, 80 rainwater harvesting systems installed, 6 farmer cooperatives established and linked to markets</li>
</ul>

<p>Woord en Daad brings technical expertise in agricultural value chains and sustainable livelihood approaches. Together, we have developed a replicable model for community-based climate adaptation that has attracted interest from other organizations working in the region.</p>`,
    },
    {
      slug: "partner-cehurd",
      title: "CEHURD (Center for Health, Human Rights and Development)",
      seoDesc: "Advocacy partnership on health rights, maternal health policy, and community-based health governance.",
      logoKey: "partner-cehurd",
      body: `<h2>Partnership Overview</h2>
<p>CEHURD is a Ugandan public interest organization focused on health and human rights. Our partnership, established in 2020, combines CEHURD's legal and policy expertise with our community-based health service delivery to advance health rights at both the community and national levels.</p>

<h3>Partnership Details</h3>
<ul>
<li><strong>Duration:</strong> 2020 — present</li>
<li><strong>Focus areas:</strong> Maternal health rights advocacy, community health governance, health worker training on rights-based approaches, and policy engagement</li>
<li><strong>Geographic scope:</strong> National-level advocacy with community implementation in our operational districts</li>
<li><strong>Key achievements:</strong> Joint policy brief on maternal health rights submitted to Ministry of Health, 150 health workers trained on rights-based service delivery, 8 community health governance structures established</li>
</ul>

<p>This partnership has strengthened the rights dimension of our health outreach work, ensuring that communities are not just receiving services but are empowered to demand accountability from the health system.</p>`,
    },
  ];

  for (const p of partners) {
    const logo = media[p.logoKey];
    await db.page.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        seoDesc: p.seoDesc,
        blocks: [
          {
            id: `${p.slug}-hero`,
            type: "hero",
            data: {
              heading: p.title,
              subheading: p.seoDesc,
              ...(logo ? { imageMediaId: logo.id } : {}),
            },
          },
          { id: `${p.slug}-body`, type: "richText", data: { html: p.body } },
        ] as never,
        status: "PUBLISHED",
      },
      create: {
        slug: p.slug,
        title: p.title,
        seoDesc: p.seoDesc,
        blocks: [
          {
            id: `${p.slug}-hero`,
            type: "hero",
            data: {
              heading: p.title,
              subheading: p.seoDesc,
              ...(logo ? { imageMediaId: logo.id } : {}),
            },
          },
          { id: `${p.slug}-body`, type: "richText", data: { html: p.body } },
        ] as never,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }
}

async function seedReportPages() {
  const reports = [
    {
      slug: "report-annual-report-2025",
      title: "Annual Report 2025",
      seoDesc: "Comprehensive review of programs, impact data, financial statements, and strategic outlook for 2025.",
      body: `<h2>Annual Report 2025</h2>
<p>This report covers the full calendar year 2025 and presents a comprehensive overview of ${BRAND_NAME}'s programs, finances, and organizational development.</p>

<h3>Program Highlights</h3>
<ul>
<li><strong>Youth Empowerment:</strong> 1,420 young people enrolled across 14 districts. 78% completion rate. 340 youth-led businesses launched.</li>
<li><strong>Climate Resilience:</strong> 800 farming households received drought-resistant seed kits. 45 rainwater harvesting systems installed. 3 farmer cooperatives linked to new markets.</li>
<li><strong>Health Outreach:</strong> 18,200 consultations conducted via mobile clinics. 2,400 referrals to district hospitals. 12,000 HIV tests facilitated.</li>
<li><strong>Community Radio:</strong> 2.1 million weekly listeners across 6 languages. 1,800 hours of original programming produced. 78% listener trust rating.</li>
</ul>

<h3>Financial Summary</h3>
<ul>
<li><strong>Total revenue:</strong> UGX 4.2 billion ($1.14 million USD)</li>
<li><strong>Program expenditure:</strong> 82% of total spending</li>
<li><strong>Administration:</strong> 12% of total spending</li>
<li><strong>Fundraising:</strong> 6% of total spending</li>
<li><strong>Audit opinion:</strong> Clean (unqualified) — eighth consecutive year</li>
</ul>

<h3>Strategic Outlook</h3>
<p>In 2026, we plan to expand climate resilience programming to two additional districts, launch a digital health pilot using mobile-based appointment scheduling, and increase our youth program enrollment by 25%.</p>`,
    },
    {
      slug: "report-annual-report-2024",
      title: "Annual Report 2024",
      seoDesc: "Program performance, financial accountability, and organizational milestones for fiscal year 2024.",
      body: `<h2>Annual Report 2024</h2>
<p>The 2024 annual report details our program performance, financial stewardship, and key organizational milestones.</p>

<h3>Program Highlights</h3>
<ul>
<li><strong>Youth Empowerment:</strong> 1,180 youth enrolled. Expanded to 3 new districts in northern Uganda. 65% of graduates reported income increases within 6 months.</li>
<li><strong>Climate Resilience:</strong> 600 households supported with climate-smart agriculture training. Partnership with Woord en Daad expanded to include market linkage component.</li>
<li><strong>Health Outreach:</strong> 15,800 consultations. Launched maternal health focused clinics in Soroti and Lira. 95% patient satisfaction rating.</li>
<li><strong>Community Radio:</strong> Reached 1.8 million listeners. Added Acholi language programming for northern Uganda audiences. Won regional community media award.</li>
</ul>

<h3>Financial Summary</h3>
<ul>
<li><strong>Total revenue:</strong> UGX 3.6 billion ($980,000 USD)</li>
<li><strong>Program expenditure:</strong> 81% of total spending</li>
<li><strong>Audit opinion:</strong> Clean (unqualified)</li>
</ul>

<h3>Key Milestone</h3>
<p>2024 marked our entry into northern Uganda with the opening of the Gulu field office. This expansion was driven by community demand from local leaders who had observed our work in eastern districts.</p>`,
    },
    {
      slug: "report-annual-report-2023",
      title: "Annual Report 2023",
      seoDesc: "Impact review covering all four programs, donor reporting, and audited financial statements for 2023.",
      body: `<h2>Annual Report 2023</h2>
<p>The 2023 annual report provides a complete account of our programs, impact, and finances for the year.</p>

<h3>Program Highlights</h3>
<ul>
<li><strong>Youth Empowerment:</strong> 980 youth enrolled across 10 districts. Introduced digital skills module. 280 businesses started by graduates.</li>
<li><strong>Climate Resilience:</strong> 450 households reached. Piloted early-warning weather notification system via community radio.</li>
<li><strong>Health Outreach:</strong> 13,500 consultations. Post-COVID recovery phase: restored full mobile clinic operations. Expanded to 2 new districts.</li>
<li><strong>Community Radio:</strong> 1.5 million weekly listeners. Launched farmer market price segments. Partnered with Ministry of Agriculture on seasonal advisory broadcasts.</li>
</ul>

<h3>Financial Summary</h3>
<ul>
<li><strong>Total revenue:</strong> UGX 3.1 billion ($840,000 USD)</li>
<li><strong>Program expenditure:</strong> 80% of total spending</li>
<li><strong>Audit opinion:</strong> Clean (unqualified)</li>
</ul>

<p>The full audited financial statements are available on request from our finance department at <a href="mailto:finance@gloford.org">finance@gloford.org</a>.</p>`,
    },
    {
      slug: "report-financial-audit-2025",
      title: "Financial Audit Report 2025",
      seoDesc: "Independent external audit of financial statements, internal controls, and compliance for fiscal year 2025.",
      body: `<h2>Independent Audit Report — Fiscal Year 2025</h2>
<p>This report presents the findings of the independent external audit of ${BRAND_NAME}'s financial statements for the year ended December 31, 2025. The audit was conducted by Deloitte Uganda in accordance with International Standards on Auditing.</p>

<h3>Audit Opinion</h3>
<p><strong>Unqualified (Clean) Opinion:</strong> In our opinion, the financial statements present fairly, in all material respects, the financial position of ${BRAND_NAME} as at December 31, 2025, and its financial performance and cash flows for the year then ended in accordance with International Financial Reporting Standards.</p>

<h3>Key Findings</h3>
<ul>
<li>Internal controls over financial reporting are operating effectively</li>
<li>All donor funds have been utilized in accordance with grant agreements</li>
<li>No material misstatements or compliance findings identified</li>
<li>Fixed asset register is complete and up to date</li>
<li>Payroll controls are adequate and functioning</li>
</ul>

<h3>Management Letter Recommendations</h3>
<p>The auditors made two minor recommendations related to procurement documentation and vehicle log management. Management has accepted both recommendations and implementation is underway.</p>`,
    },
    {
      slug: "report-impact-assessment-2024",
      title: "Impact Assessment 2024",
      seoDesc: "Rigorous evaluation of program outcomes across youth empowerment, health, climate resilience, and radio.",
      body: `<h2>Impact Assessment 2024</h2>
<p>This assessment evaluates the outcomes and impact of ${BRAND_NAME}'s four core programs using a mixed-methods approach combining quantitative surveys, qualitative interviews, focus groups, and administrative data analysis.</p>

<h3>Methodology</h3>
<p>The assessment was conducted by an external evaluation team from Makerere University School of Public Health. It covered a representative sample of 1,200 beneficiaries across all operational districts, with a comparison group of 400 non-beneficiaries for counterfactual analysis.</p>

<h3>Key Findings</h3>
<ul>
<li><strong>Youth Program:</strong> 65% of graduates reported increased income within 12 months. Business survival rate at 18 months was 72%. Participants showed significantly higher levels of self-efficacy and civic engagement compared to the comparison group.</li>
<li><strong>Health Program:</strong> Mobile clinic users reported 40% higher rates of antenatal care attendance. HIV testing uptake in served communities was 3x higher than district averages. Maternal health knowledge scores improved by 55% post-intervention.</li>
<li><strong>Climate Program:</strong> Households using drought-resistant varieties reported 35% higher crop yields during dry seasons. Water harvesting adopters reduced water collection time by an average of 45 minutes per day.</li>
<li><strong>Radio Program:</strong> 82% of regular listeners could correctly identify at least 3 COVID-19 prevention measures (vs. 54% among non-listeners). Agricultural price information broadcasts were associated with 15% higher farmgate prices for participating farmers.</li>
</ul>

<p>The full assessment report is available on request for donors and research partners.</p>`,
    },
  ];

  for (const r of reports) {
    await db.page.upsert({
      where: { slug: r.slug },
      update: {
        title: r.title,
        seoDesc: r.seoDesc,
        blocks: [
          {
            id: `${r.slug}-hero`,
            type: "hero",
            data: {
              heading: r.title,
              subheading: r.seoDesc,
            },
          },
          { id: `${r.slug}-body`, type: "richText", data: { html: r.body } },
        ] as never,
        status: "PUBLISHED",
      },
      create: {
        slug: r.slug,
        title: r.title,
        seoDesc: r.seoDesc,
        blocks: [
          {
            id: `${r.slug}-hero`,
            type: "hero",
            data: {
              heading: r.title,
              subheading: r.seoDesc,
            },
          },
          { id: `${r.slug}-body`, type: "richText", data: { html: r.body } },
        ] as never,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }
}

async function seedImpactStoryPages(media: Record<string, SeededMedia>) {
  const stories = [
    {
      slug: "impact-story-apio-rose-health-journey",
      title: "How Apio Rose Accessed Maternal Care That Saved Her Life",
      seoDesc: "A first-time mother in Soroti district received life-saving prenatal care through our mobile health clinic when the nearest hospital was 40km away.",
      imageKey: "hero-field",
      body: `<h2>A Mother's Story</h2>
<p>Apio Rose was 22 years old and seven months pregnant when she first visited one of ${BRAND_NAME}'s mobile health clinics in Soroti district. The nearest hospital was over 40 kilometers away, and the local health center had been without a midwife for six months.</p>

<p>"I had been feeling pain for weeks but I did not know where to go," Rose recalls. "When the mobile clinic came to our trading center, I walked there with my mother-in-law. The nurse examined me and said I needed to go to the hospital urgently."</p>

<p>The ${BRAND_NAME} health team identified signs of pre-eclampsia — dangerously high blood pressure that, if untreated, can lead to seizures and death during delivery. Our referral coordinator arranged emergency transport to Soroti Regional Referral Hospital, where Rose received treatment and delivered a healthy baby girl two weeks later.</p>

<p>"Without that mobile clinic, I do not know what would have happened," says Rose. "Now I tell every pregnant woman in my village to go for check-ups. The ${BRAND_NAME} people saved my life and my baby's life."</p>

<h3>Why This Matters</h3>
<p>Uganda's maternal mortality rate remains among the highest in the world, with rural women facing the greatest barriers to care. ${BRAND_NAME}'s mobile clinics bring essential prenatal, postnatal, and reproductive health services directly to communities that would otherwise go without. In 2025, our clinics facilitated 2,400 referrals like Rose's — each one potentially life-saving.</p>`,
    },
    {
      slug: "impact-story-youth-business-okello",
      title: "From Mentee to Mentor: Okello David's Business Journey",
      seoDesc: "A young man from Jinja completed our youth empowerment program, started a successful welding business, and now mentors the next cohort.",
      imageKey: "hero-youth",
      body: `<h2>Building a Future With His Own Hands</h2>
<p>Okello David dropped out of secondary school at 17 when his family could no longer afford fees. For two years, he did casual labor — loading trucks, digging gardens, washing cars — earning just enough to eat. "I had no plan and no hope," David remembers. "Every day was the same."</p>

<p>In 2023, David enrolled in ${BRAND_NAME}'s Youth Empowerment program after hearing about it through a community radio broadcast. The six-month program combined vocational skills training (David chose welding), financial literacy, life skills, and ongoing mentorship from a successful local entrepreneur.</p>

<p>"The training changed how I think about money and about myself," says David. "Before, I spent whatever I earned the same day. They taught me to save, to plan, to think about customers and quality."</p>

<p>After completing the program, David received a starter toolkit — a welding machine, protective gear, and basic materials — along with three months of business coaching. He set up a small workshop in Jinja town and began taking orders for gates, window frames, and agricultural implements.</p>

<p>Two years later, David employs two assistants and earns enough to support his family, pay his younger siblings' school fees, and save for expansion. In 2025, he was invited to serve as a peer mentor in the next Youth Empowerment cohort — teaching the same skills that transformed his own life.</p>

<p>"When I see these young people come in with no confidence, I remember how I felt," David says. "I tell them: your situation is not permanent. You can change it. I am the proof."</p>

<h3>Impact by the Numbers</h3>
<p>Since 2011, our Youth Empowerment program has enrolled over 5,400 young people. 78% complete the full six-month cycle. Among graduates, 65% report increased income within 12 months, and the business survival rate at 18 months is 72%.</p>`,
    },
    {
      slug: "impact-story-climate-farmer-cooperative",
      title: "How 200 Farming Families Beat the Drought Together",
      seoDesc: "A farmer cooperative in Kumi district adopted drought-resistant crops and water harvesting through our climate resilience program.",
      imageKey: "hero-climate",
      body: `<h2>Planting for a Changing Climate</h2>
<p>When the 2024 dry season hit Kumi district harder than any in living memory, most farming families watched their crops wither. But the 200 households in the Amuria Farmers' Cooperative — participants in ${BRAND_NAME}'s Climate Resilience program — harvested enough to feed their families and sell the surplus.</p>

<p>"Before the program, we planted the same varieties our grandparents used," says Ikara Moses, the cooperative's chairperson. "When the rains changed, we had no answer. Now we have drought-resistant maize, improved cassava, and water harvesting tanks that carry us through the dry months."</p>

<p>${BRAND_NAME}'s climate resilience team worked with the Amuria cooperative for 18 months, providing training on drought-resistant crop varieties, soil conservation techniques, and rainwater harvesting. Each household received seed kits and technical support from our agricultural extension officers, who visited monthly to troubleshoot and adjust approaches based on local conditions.</p>

<p>The cooperative also received support to organize collectively — pooling resources to negotiate better prices with buyers, sharing equipment, and establishing a community seed bank that reduces dependence on external suppliers.</p>

<p>"The difference is not just the seed," Ikara explains. "It is the knowledge and the cooperation. We learned to plan together, to share what works, and to prepare for the worst season instead of just hoping for the best."</p>

<h3>Scaling the Model</h3>
<p>The Amuria model has been replicated in five other sub-counties across Teso sub-region. In 2025, ${BRAND_NAME}'s climate program reached 800 farming households and installed 45 community-level rainwater harvesting systems. Participating households reported 35% higher crop yields during dry seasons compared to non-participants.</p>`,
    },
    {
      slug: "impact-story-radio-saves-lives",
      title: "When Radio Became the Only Lifeline: COVID-19 in Rural Uganda",
      seoDesc: "During COVID-19 lockdowns, our community radio station became the primary source of health information for millions of rural Ugandans.",
      imageKey: "hero-radio",
      body: `<h2>Information as a Lifeline</h2>
<p>When Uganda entered its first COVID-19 lockdown in March 2020, most rural communities lost their primary sources of information overnight. Health facilities reduced services, schools closed, community meetings were banned, and many families had no internet access. For millions of people in eastern Uganda, ${BRAND_NAME}'s community radio station became the only reliable source of public health information.</p>

<p>"We went from a regular programming schedule to an emergency information service in 48 hours," recalls Agnes Acen, Head of Communications. "We partnered with the Ministry of Health to broadcast prevention guidelines, debunk misinformation, and provide daily updates in six local languages. For many listeners, our broadcasts were the only way they learned about hand-washing protocols, mask guidance, and vaccination schedules."</p>

<p>The station also launched a call-in helpline where listeners could ask health questions and receive guidance from trained community health workers. During the first three months of lockdown, the helpline received over 4,000 calls — many from people who had no other way to access health advice.</p>

<p>"A woman called to say her husband was very sick with fever and she did not know if it was COVID or malaria," Agnes recalls. "Our health worker guided her through a symptom assessment and helped arrange transport to the nearest health facility. It turned out to be severe malaria. If she had waited, it could have been fatal."</p>

<h3>Lasting Impact</h3>
<p>A post-pandemic survey found that 82% of regular listeners could correctly identify at least three COVID-19 prevention measures, compared to 54% among non-listeners. The experience reinforced the critical role of community radio as a public health tool and led to permanent health advisory segments in our regular programming schedule.</p>

<p>Today, the station reaches over 2 million listeners weekly and maintains a 78% trust rating — among the highest for any community media outlet in East Africa.</p>`,
    },
  ];

  for (const story of stories) {
    const image = media[story.imageKey];
    await db.page.upsert({
      where: { slug: story.slug },
      update: {
        title: story.title,
        seoDesc: story.seoDesc,
        blocks: [
          {
            id: `${story.slug}-hero`,
            type: "hero",
            data: {
              heading: story.title,
              subheading: story.seoDesc,
              ...(image ? { imageMediaId: image.id } : {}),
            },
          },
          { id: `${story.slug}-body`, type: "richText", data: { html: story.body } },
        ] as never,
        status: "PUBLISHED",
      },
      create: {
        slug: story.slug,
        title: story.title,
        seoDesc: story.seoDesc,
        blocks: [
          {
            id: `${story.slug}-hero`,
            type: "hero",
            data: {
              heading: story.title,
              subheading: story.seoDesc,
              ...(image ? { imageMediaId: image.id } : {}),
            },
          },
          { id: `${story.slug}-body`, type: "richText", data: { html: story.body } },
        ] as never,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

// ─── Hero Slides ─────────────────────────────────────────────
async function seedHeroSlides() {
  const slides = [
    {
      title: "Empowering Communities Through Education",
      subtitle: "Building a brighter future for every child in East Africa",
      ctaLabel: "Donate Now",
      ctaHref: "/donate",
      imageUrl: "/seed-images/gloford/hero-community.jpg",
      imageAlt: "Children in classroom",
      order: 0,
      durationMs: 15000,
    },
    {
      title: "Healthcare for Every Village",
      subtitle: "Mobile clinics and community health workers reaching those in need",
      ctaLabel: "Our Programs",
      ctaHref: "/programs",
      imageUrl: "/seed-images/gloford/hero-community.jpg",
      imageAlt: "Healthcare outreach",
      order: 1,
      durationMs: 15000,
    },
    {
      title: "Sustainable Development, Lasting Impact",
      subtitle: "Training communities in agriculture, microfinance, and environmental conservation",
      ctaLabel: "Get Involved",
      ctaHref: "/get-involved",
      imageUrl: "/seed-images/gloford/hero-community.jpg",
      imageAlt: "Community farming project",
      order: 2,
      durationMs: 15000,
    },
  ];
  for (const slide of slides) {
    const existing = await db.heroSlide.findFirst({ where: { title: slide.title } });
    if (!existing) await db.heroSlide.create({ data: slide });
  }
}

// ─── Testimonials ─────────────────────────────────────────────
async function seedTestimonials() {
  const items = [
    {
      quote: "Gloford Foundation transformed our community. The education program has given our children opportunities we never dreamed possible.",
      authorName: "Sarah Nakamya",
      authorRole: "Community Leader",
      authorOrg: "Mukono District",
      rating: 5,
      order: 0,
    },
    {
      quote: "The healthcare outreach program saved lives in our village. We now have trained health workers and regular medical check-ups.",
      authorName: "Dr. James Okello",
      authorRole: "District Health Officer",
      authorOrg: "Lira District",
      rating: 5,
      order: 1,
    },
    {
      quote: "Their microfinance training gave me the skills to start my own business. I can now support my family and employ others.",
      authorName: "Grace Achieng",
      authorRole: "Entrepreneur",
      authorOrg: "Women's Cooperative",
      rating: 5,
      order: 2,
    },
  ];
  for (const t of items) {
    const existing = await db.testimonial.findFirst({ where: { authorName: t.authorName } });
    if (!existing) await db.testimonial.create({ data: t });
  }
}

// ─── Site Statistics ─────────────────────────────────────────
async function seedSiteStats() {
  const stats = [
    { label: "Communities Served", value: "120+", order: 0 },
    { label: "Lives Impacted", value: "50,000+", order: 1 },
    { label: "Active Programs", value: "14", order: 2 },
    { label: "Years of Impact", value: "10+", order: 3 },
  ];
  for (const s of stats) {
    const existing = await db.siteStatistic.findFirst({ where: { label: s.label } });
    if (!existing) await db.siteStatistic.create({ data: s });
  }
}

// ─── Leader Messages ─────────────────────────────────────────
async function seedLeaderMessages() {
  const messages = [
    {
      leaderName: "John Mukasa",
      title: "A Message from Our CEO",
      role: "Chief Executive Officer",
      message: "Since our founding, we have been driven by a single purpose: to create lasting change in communities that need it most. Every program we run, every partnership we build, and every life we touch is guided by our commitment to dignity, empowerment, and sustainability.\n\nAs we look to the future, I am filled with optimism. The resilience and determination of the communities we serve inspire us every day. Together, we are building a world where opportunity is not a privilege but a right.\n\nThank you for being part of this journey.",
      signature: "John Mukasa, CEO",
      order: 0,
    },
    {
      leaderName: "Dr. Agnes Nantongo",
      title: "From the Board Chair",
      role: "Board Chairperson",
      message: "As Board Chairperson, I have had the privilege of watching this organization grow from a grassroots initiative into a force for transformative change. Our board is committed to ensuring that every resource is used effectively and that our impact is measurable and sustainable.\n\nWe believe in transparency, accountability, and above all, the power of community-driven development. Our strategic direction ensures that we remain focused on the areas where we can make the greatest difference.\n\nI invite you to join us in this mission.",
      signature: "Dr. Agnes Nantongo, Board Chair",
      order: 1,
    },
  ];
  for (const m of messages) {
    const existing = await db.leaderMessage.findFirst({ where: { leaderName: m.leaderName } });
    if (!existing) await db.leaderMessage.create({ data: m });
  }
}

// ─── Team Members ─────────────────────────────────────────────
async function seedTeamMembers() {
  const members = [
    {
      name: "John Mukasa",
      role: "Chief Executive Officer",
      department: "Leadership",
      bio: "John has over 15 years of experience in community development and has led the foundation since its inception.",
      socialLinks: { linkedin: "https://linkedin.com", twitter: "https://twitter.com" },
      order: 0,
    },
    {
      name: "Dr. Agnes Nantongo",
      role: "Board Chairperson",
      department: "Board",
      bio: "Dr. Nantongo brings decades of public health expertise and strategic governance experience to the board.",
      socialLinks: { linkedin: "https://linkedin.com" },
      order: 1,
    },
    {
      name: "Peter Ochieng",
      role: "Programs Director",
      department: "Leadership",
      bio: "Peter oversees all program implementation, ensuring quality delivery and community engagement across all regions.",
      socialLinks: { linkedin: "https://linkedin.com", twitter: "https://twitter.com" },
      order: 2,
    },
    {
      name: "Mary Akoth",
      role: "Finance & Operations Manager",
      department: "Leadership",
      bio: "Mary ensures financial transparency and operational excellence across the organization.",
      socialLinks: { linkedin: "https://linkedin.com" },
      order: 3,
    },
    {
      name: "David Ssempa",
      role: "Communications Lead",
      department: "Staff",
      bio: "David tells the stories of impact, managing our brand presence and community outreach communications.",
      socialLinks: { twitter: "https://twitter.com", instagram: "https://instagram.com" },
      order: 4,
    },
    {
      name: "Florence Namuli",
      role: "Community Engagement Officer",
      department: "Staff",
      bio: "Florence works directly with communities to understand needs and co-design program solutions.",
      socialLinks: { linkedin: "https://linkedin.com" },
      order: 5,
    },
  ];
  for (const m of members) {
    const existing = await db.teamMember.findFirst({ where: { name: m.name } });
    if (!existing) await db.teamMember.create({ data: m });
  }
}

// ─── Careers ─────────────────────────────────────────────────
async function seedCareers() {
  const jobs = [
    {
      title: "Community Health Coordinator",
      slug: "community-health-coordinator",
      department: "Programs",
      location: "Kampala, Uganda",
      type: "FULL_TIME" as const,
      description: "Lead and coordinate community health programs across multiple districts, ensuring quality delivery and measurable impact.",
      requirements: ["Bachelor's degree in Public Health or related field", "3+ years in community health programs", "Experience in rural settings", "Valid driving license"],
      responsibilities: ["Coordinate mobile clinic operations", "Train community health workers", "Monitor and evaluate program outcomes", "Prepare quarterly reports"],
      qualifications: ["MPH preferred", "Experience with HMIS systems", "Fluency in English and Luganda"],
      benefits: ["Competitive salary", "Health insurance", "Professional development", "Travel allowance"],
      salaryRange: "UGX 3,000,000 - 5,000,000",
    },
    {
      title: "Education Program Officer",
      slug: "education-program-officer",
      department: "Programs",
      location: "Gulu, Uganda",
      type: "FULL_TIME" as const,
      description: "Design and implement education programs for primary and secondary schools in Northern Uganda.",
      requirements: ["Degree in Education or Social Sciences", "2+ years working with schools", "Knowledge of UPE curriculum"],
      responsibilities: ["Develop training materials", "Conduct teacher workshops", "Monitor student outcomes", "Engage with school management committees"],
      qualifications: ["Teaching certificate an advantage", "Report writing skills"],
      benefits: ["Competitive package", "Housing allowance", "Annual leave"],
    },
    {
      title: "Digital Communications Intern",
      slug: "digital-communications-intern",
      department: "Communications",
      location: "Kampala, Uganda (Remote-friendly)",
      type: "INTERNSHIP" as const,
      description: "Support the communications team with social media management, content creation, and digital storytelling.",
      requirements: ["Enrolled in or recently graduated from relevant program", "Strong writing skills", "Social media proficiency"],
      responsibilities: ["Create social media content", "Write blog posts", "Assist with newsletter production", "Photo and video documentation"],
      qualifications: ["Portfolio of writing samples", "Basic design skills (Canva, etc.)"],
      benefits: ["Monthly stipend", "Mentorship", "Certificate of completion"],
    },
  ];
  for (const job of jobs) {
    const existing = await db.career.findFirst({ where: { slug: job.slug } });
    if (!existing) await db.career.create({ data: job });
  }
}

// ─── FAQs ─────────────────────────────────────────────────────
async function seedFaqs() {
  const faqs = [
    { question: "How can I donate to the foundation?", answer: "You can donate through our website via mobile money (MTN MoMo, Airtel Money) or Pesapal. Visit our Donate page to get started.", category: "general", order: 0 },
    { question: "Where does my donation go?", answer: "100% of your donation goes directly to program implementation. Administrative costs are covered by institutional grants and partnerships.", category: "general", order: 1 },
    { question: "Can I volunteer with the foundation?", answer: "Yes! We welcome volunteers in various capacities including community outreach, education support, healthcare, and digital communications. Visit our Get Involved page.", category: "general", order: 2 },
    { question: "How do you measure impact?", answer: "We use rigorous monitoring and evaluation frameworks, including baseline surveys, quarterly assessments, and annual impact reports. All reports are publicly available.", category: "general", order: 3 },
    { question: "How can my organization partner with you?", answer: "We welcome partnerships with organizations that share our vision. Please fill out the partnership application form on our Partners page or contact us directly.", category: "partnerships", order: 0 },
    { question: "What types of partnerships do you offer?", answer: "We offer strategic, funding, technical, and implementation partnerships. Each is tailored to maximize mutual impact and aligned with our strategic objectives.", category: "partnerships", order: 1 },
    { question: "Are there career opportunities available?", answer: "We regularly post job openings on our Careers page. We offer positions in programs, communications, finance, and administration across our operating regions.", category: "general", order: 4 },
  ];
  for (const faq of faqs) {
    const existing = await db.faq.findFirst({ where: { question: faq.question } });
    if (!existing) await db.faq.create({ data: faq });
  }
}

// ─── Volunteer Opportunities ─────────────────────────────
async function seedVolunteerOpportunities() {
  const opps = [
    {
      title: "Community Health Volunteer",
      slug: "community-health-volunteer",
      department: "Healthcare",
      location: "Mukono District, Uganda",
      commitment: "10 hours/week for 3 months",
      description: "Support our mobile health clinics by assisting with patient registration, health education, and follow-up visits in rural communities.",
      requirements: ["Basic health knowledge", "Good communication skills", "Ability to travel within the district", "Fluency in Luganda preferred"],
      benefits: ["Training certificate", "Transport allowance", "Letter of recommendation", "Networking opportunities"],
    },
    {
      title: "Education Tutor",
      slug: "education-tutor",
      department: "Education",
      location: "Gulu, Uganda",
      commitment: "5 hours/week for 6 months",
      description: "Provide tutoring and mentorship to primary school students in mathematics, English, and science. Help improve academic performance in underserved schools.",
      requirements: ["Teaching experience or education background", "Patience and empathy", "Available on weekday afternoons"],
      benefits: ["Teaching materials provided", "Monthly stipend", "Professional development workshops"],
    },
    {
      title: "Digital Skills Trainer",
      slug: "digital-skills-trainer",
      department: "Technology",
      location: "Kampala, Uganda (Remote-friendly)",
      commitment: "Flexible, 8 hours/week",
      description: "Teach basic computer literacy, internet safety, and digital skills to youth and women's groups. Help bridge the digital divide in our communities.",
      requirements: ["Proficiency in basic computer applications", "Training or facilitation experience", "Own laptop preferred"],
      benefits: ["Internet allowance", "Certificate of recognition", "Portfolio building opportunity"],
    },
    {
      title: "Agricultural Extension Volunteer",
      slug: "agricultural-extension-volunteer",
      department: "Agriculture",
      location: "Lira District, Uganda",
      commitment: "15 hours/week for 4 months",
      description: "Work alongside farmers to implement sustainable agriculture practices, including crop rotation, composting, and water conservation techniques.",
      requirements: ["Agricultural knowledge or farming experience", "Physical fitness for field work", "Willingness to live in rural area"],
      benefits: ["Accommodation provided", "Meals allowance", "Agricultural training certification"],
    },
  ];
  for (const opp of opps) {
    const existing = await db.volunteerOpportunity.findFirst({ where: { slug: opp.slug } });
    if (!existing) await db.volunteerOpportunity.create({ data: opp });
  }
}

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
