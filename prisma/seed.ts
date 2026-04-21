/**
 * Gloford seed
 *
 * Idempotent seed of base data + rich demo content drawn from
 * gloford.org:
 *   • Roles + Permissions (from lib/rbac/permissions.ts)
 *   • Gloford organization + default Theme + SiteSettings + NavItems
 *   • Built-in segments (Donors, Youth, Volunteers, Partners)
 *   • Admin user from SEED_ADMIN_* env
 *   • Media library referencing files in /public/seed-images/
 *   • About + Contact pages
 *   • Six core Programs (CoSPAs)
 *   • Three blog posts with tags
 *   • One active fundraising Campaign
 *   • Six sample subscribers across segments
 *   • One draft newsletter
 *   • One upcoming event
 *
 * Tenant writes are wrapped in a transaction that sets the
 * app.current_org GUC so Postgres RLS allows them.
 */

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaClient, type RoleName, type Prisma } from "@prisma/client";
import { PERMISSIONS, ROLE_MATRIX } from "../lib/rbac/permissions";
import {
  MEDIA_FILES,
  PAGES,
  PROGRAMS,
  POSTS,
  CAMPAIGN,
  SUBSCRIBERS,
  NEWSLETTER,
  EVENT,
  HEADER_NAV,
  FOOTER_NAV,
  asJson,
} from "./seed/gloford-content";

const db = new PrismaClient();

async function main() {
  console.log("\u2192 Seeding roles & permissions\u2026");
  await seedRolesAndPermissions();

  console.log("\u2192 Seeding Gloford organization\u2026");
  const org = await seedOrganization();

  console.log("\u2192 Seeding theme, site settings, nav, segments\u2026");
  await seedTenantBasics(org.id);

  console.log("\u2192 Seeding media library\u2026");
  const mediaByKey = await seedMedia(org.id);

  console.log("\u2192 Seeding admin user\u2026");
  const admin = await seedAdminUser(org.id);

  console.log("\u2192 Seeding pages, programs, posts\u2026");
  await seedContent(org.id, admin.id, mediaByKey);

  console.log("\u2192 Seeding campaign + donors/subscribers\u2026");
  await seedCommunity(org.id, admin.id);

  console.log("\u2192 Seeding events\u2026");
  await seedEvents(org.id);

  console.log("\u2713 Seed complete");
}

// ─── Roles & permissions ──────────────────────────────────────

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

  for (const roleName of ROLES) {
    const role = await db.role.findUniqueOrThrow({ where: { name: roleName } });
    const matrix = ROLE_MATRIX[roleName];
    const desired = PERMISSIONS.filter((perm) => {
      const grant = matrix[perm.module];
      if (!grant) return false;
      return grant === "*" || grant.includes(perm.action);
    });

    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    await db.rolePermission.createMany({
      data: await Promise.all(
        desired.map(async (p) => ({
          roleId: role.id,
          permissionId: (await db.permission.findUniqueOrThrow({ where: { key: p.key } })).id,
        })),
      ),
      skipDuplicates: true,
    });
  }
}

// ─── Organization ─────────────────────────────────────────────

async function seedOrganization() {
  return db.organization.upsert({
    where: { slug: "gloford" },
    update: { logoUrl: "/seed-images/gloford/logo.png" },
    create: {
      slug: "gloford",
      name: "Gloford",
      logoUrl: "/seed-images/gloford/logo.png",
      contactJson: {
        email: "info@gloford.org",
        phone: "+256 000 000 000",
        address: "Gulu, Northern Uganda",
      },
    },
  });
}

// ─── Theme / settings / nav / system segments ───────────────

async function seedTenantBasics(orgId: string) {
  await withTenant(orgId, async (tx) => {
    await tx.theme.upsert({
      where: { organizationId: orgId },
      update: {},
      create: {
        organizationId: orgId,
        colors: {
          bg: "0 0% 100%",
          fg: "224 71% 4%",
          muted: "220 14% 96%",
          "muted-fg": "220 9% 46%",
          card: "0 0% 100%",
          "card-fg": "224 71% 4%",
          border: "220 13% 91%",
          input: "220 13% 91%",
          ring: "215 20% 65%",
          // Gloford green + earthy accent, tuned for accessibility.
          primary: "147 54% 27%",
          "primary-fg": "0 0% 100%",
          secondary: "35 45% 93%",
          "secondary-fg": "20 30% 18%",
          accent: "35 92% 52%",
          "accent-fg": "224 71% 4%",
          danger: "0 84% 60%",
          "danger-fg": "0 0% 100%",
          success: "142 71% 45%",
        },
        typography: {
          sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
          serif: "ui-serif, Georgia, serif",
        },
        radius: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem" },
        shadows: {},
      },
    });

    await tx.siteSettings.upsert({
      where: { organizationId: orgId },
      update: {
        siteName: "Gloford",
        logoUrl: "/seed-images/gloford/logo.png",
      },
      create: {
        organizationId: orgId,
        siteName: "Gloford",
        logoUrl: "/seed-images/gloford/logo.png",
        contact: {
          email: "info@gloford.org",
          phone: "+256 000 000 000",
          address: "Gulu, Northern Uganda",
        },
        socials: {
          facebook: "https://facebook.com/gloford",
          twitter: "https://twitter.com/gloford",
        },
        seo: {
          title: "Gloford Uganda",
          description:
            "Community partnerships for health, education, resilience, and youth leadership in Northern Uganda.",
        },
      },
    });

    for (const l of HEADER_NAV) {
      await tx.navItem.upsert({
        where: { id: `seed-header-${l.order}` },
        update: { label: l.label, href: l.href, order: l.order },
        create: {
          id: `seed-header-${l.order}`,
          organizationId: orgId,
          location: "HEADER",
          label: l.label,
          href: l.href,
          order: l.order,
        },
      });
    }
    for (const l of FOOTER_NAV) {
      await tx.navItem.upsert({
        where: { id: `seed-footer-${l.order}` },
        update: { label: l.label, href: l.href, order: l.order },
        create: {
          id: `seed-footer-${l.order}`,
          organizationId: orgId,
          location: "FOOTER",
          label: l.label,
          href: l.href,
          order: l.order,
        },
      });
    }

    const systemSegments = [
      { slug: "donors", name: "Donors", description: "People who have donated at least once" },
      { slug: "youth", name: "Youth", description: "Young people engaged with Gloford programs" },
      {
        slug: "volunteers",
        name: "Volunteers",
        description: "Active volunteers and interns",
      },
      {
        slug: "partners",
        name: "Partners",
        description: "Partner organizations and collaborators",
      },
    ];
    for (const s of systemSegments) {
      await tx.segment.upsert({
        where: { organizationId_slug: { organizationId: orgId, slug: s.slug } },
        update: {},
        create: {
          organizationId: orgId,
          slug: s.slug,
          name: s.name,
          description: s.description,
          isSystem: true,
        },
      });
    }
  });
}

// ─── Media library ──────────────────────────────────────────

async function seedMedia(orgId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await withTenant(orgId, async (tx) => {
    for (const m of MEDIA_FILES) {
      const existing = await tx.media.findUnique({ where: { key: m.key } });
      const row = existing
        ? await tx.media.update({
            where: { id: existing.id },
            data: {
              url: m.url,
              mime: m.mime,
              width: m.width,
              height: m.height,
              alt: m.alt,
              sizeBytes: m.size,
            },
          })
        : await tx.media.create({
            data: {
              organizationId: orgId,
              url: m.url,
              key: m.key,
              mime: m.mime,
              width: m.width,
              height: m.height,
              alt: m.alt,
              sizeBytes: m.size,
            },
          });
      map.set(m.key, row.id);
    }
  });
  return map;
}

// ─── Admin user ─────────────────────────────────────────────

async function seedAdminUser(orgId: string) {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@gloford.org";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "change-me-on-first-login";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true },
    create: {
      email,
      name: "Gloford Admin",
      passwordHash,
      isActive: true,
      profile: {
        create: {
          firstName: "Gloford",
          lastName: "Admin",
          preferences: { locale: "en", timezone: "Africa/Kampala" },
        },
      },
    },
  });

  const superAdmin = await db.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });

  await withTenant(orgId, async (tx) => {
    await tx.orgMembership.upsert({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
      update: { roleId: superAdmin.id },
      create: { organizationId: orgId, userId: user.id, roleId: superAdmin.id },
    });
  });

  console.log(`  admin: ${email}`);
  if (password === "change-me-on-first-login") {
    console.log("  \u26a0 using default password. Set SEED_ADMIN_PASSWORD before running in prod.");
  }
  return user;
}

// ─── Content (pages, programs, posts) ───────────────────────

async function seedContent(orgId: string, authorId: string, _mediaByKey: Map<string, string>) {
  await withTenant(orgId, async (tx) => {
    for (const p of PAGES) {
      await tx.page.upsert({
        where: { organizationId_slug: { organizationId: orgId, slug: p.slug } },
        update: {
          title: p.title,
          seoTitle: p.seoTitle,
          seoDesc: p.seoDesc,
          blocks: asJson(p.blocks),
          status: p.status,
          publishedAt: new Date(),
        },
        create: {
          organizationId: orgId,
          slug: p.slug,
          title: p.title,
          seoTitle: p.seoTitle,
          seoDesc: p.seoDesc,
          blocks: asJson(p.blocks),
          status: p.status,
          publishedAt: new Date(),
        },
      });
    }

    for (const p of PROGRAMS) {
      await tx.program.upsert({
        where: { organizationId_slug: { organizationId: orgId, slug: p.slug } },
        update: {
          title: p.title,
          summary: p.summary,
          body: asJson(p.body),
          order: p.order,
          status: p.status,
        },
        create: {
          organizationId: orgId,
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          body: asJson(p.body),
          order: p.order,
          status: p.status,
        },
      });
    }

    for (const post of POSTS) {
      for (const tagSlug of post.tagSlugs) {
        await tx.tag.upsert({
          where: { organizationId_slug: { organizationId: orgId, slug: tagSlug } },
          update: {},
          create: {
            organizationId: orgId,
            slug: tagSlug,
            name: tagSlug.replace(/-/g, " "),
          },
        });
      }

      const tagIds = (await Promise.all(
        post.tagSlugs.map((s) =>
          tx.tag.findUnique({
            where: { organizationId_slug: { organizationId: orgId, slug: s } },
            select: { id: true },
          }),
        ),
      ))
        .filter((t): t is { id: string } => !!t)
        .map((t) => t.id);

      const existing = await tx.post.findUnique({
        where: { organizationId_slug: { organizationId: orgId, slug: post.slug } },
      });
      const saved = existing
        ? await tx.post.update({
            where: { id: existing.id },
            data: {
              title: post.title,
              excerpt: post.excerpt,
              body: asJson(post.body),
              status: post.status,
              publishedAt: new Date(),
            },
          })
        : await tx.post.create({
            data: {
              organizationId: orgId,
              slug: post.slug,
              title: post.title,
              excerpt: post.excerpt,
              body: asJson(post.body),
              authorId,
              status: post.status,
              publishedAt: new Date(),
            },
          });

      await tx.postTag.deleteMany({ where: { postId: saved.id } });
      await tx.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId: saved.id, tagId })),
        skipDuplicates: true,
      });
    }
  });
}

// ─── Community (campaign + subscribers + newsletter) ────────

async function seedCommunity(orgId: string, authorId: string) {
  await withTenant(orgId, async (tx) => {
    await tx.campaign.upsert({
      where: {
        organizationId_slug: { organizationId: orgId, slug: CAMPAIGN.slug },
      },
      update: {
        title: CAMPAIGN.title,
        description: CAMPAIGN.description,
        goalCents: CAMPAIGN.goalCents,
        currency: CAMPAIGN.currency,
        isActive: CAMPAIGN.isActive,
      },
      create: {
        organizationId: orgId,
        slug: CAMPAIGN.slug,
        title: CAMPAIGN.title,
        description: CAMPAIGN.description,
        goalCents: CAMPAIGN.goalCents,
        currency: CAMPAIGN.currency,
        isActive: CAMPAIGN.isActive,
      },
    });

    for (const s of SUBSCRIBERS) {
      const subscriber = await tx.subscriber.upsert({
        where: {
          organizationId_email: { organizationId: orgId, email: s.email },
        },
        update: { name: s.name, status: "ACTIVE" },
        create: {
          organizationId: orgId,
          email: s.email,
          name: s.name,
          status: "ACTIVE",
          source: "seed",
          unsubToken: randomBytes(16).toString("hex"),
          confirmedAt: new Date(),
        },
      });

      for (const segSlug of s.segments) {
        const seg = await tx.segment.findUnique({
          where: { organizationId_slug: { organizationId: orgId, slug: segSlug } },
          select: { id: true },
        });
        if (!seg) continue;
        await tx.subscriberSegment.upsert({
          where: {
            subscriberId_segmentId: { subscriberId: subscriber.id, segmentId: seg.id },
          },
          update: {},
          create: {
            subscriberId: subscriber.id,
            segmentId: seg.id,
            source: "MANUAL",
          },
        });
      }
    }

    // Draft newsletter. Use deterministic id so seed is idempotent.
    await tx.newsletter.upsert({
      where: { id: "seed-newsletter-april-2026" },
      update: {
        title: NEWSLETTER.title,
        subject: NEWSLETTER.subject,
        preheader: NEWSLETTER.preheader,
        content: asJson(NEWSLETTER.content),
      },
      create: {
        id: "seed-newsletter-april-2026",
        organizationId: orgId,
        title: NEWSLETTER.title,
        subject: NEWSLETTER.subject,
        preheader: NEWSLETTER.preheader,
        content: asJson(NEWSLETTER.content),
        status: "DRAFT",
        segmentIds: [],
        createdById: authorId,
      },
    });
  });
}

// ─── Events ────────────────────────────────────────────────

async function seedEvents(orgId: string) {
  await withTenant(orgId, async (tx) => {
    await tx.event.upsert({
      where: {
        organizationId_slug: { organizationId: orgId, slug: EVENT.slug },
      },
      update: {
        title: EVENT.title,
        description: EVENT.description,
        startsAt: EVENT.startsAt,
        endsAt: EVENT.endsAt,
        location: EVENT.location,
        isPublic: EVENT.isPublic,
      },
      create: {
        organizationId: orgId,
        slug: EVENT.slug,
        title: EVENT.title,
        description: EVENT.description,
        startsAt: EVENT.startsAt,
        endsAt: EVENT.endsAt,
        location: EVENT.location,
        isPublic: EVENT.isPublic,
      },
    });
  });
}

// ─── Tenant transaction helper ──────────────────────────────

async function withTenant<T>(
  orgId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_org', ${orgId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_user', ${"seed"}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_role', ${"SUPER_ADMIN"}, true)`;
    return fn(tx);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
