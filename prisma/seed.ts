/**
 * Gloford seed
 *
 * Creates the base data every environment needs:
 *   • Roles + Permissions (from lib/rbac/permissions.ts)
 *   • Gloford organization + default Theme + SiteSettings + NavItems
 *   • Built-in segments (Donors, Youth, Volunteers, Partners)
 *   • Admin user + OrgMembership (from SEED_ADMIN_* env vars)
 *
 * Idempotent: safe to run repeatedly. Uses upserts throughout.
 *
 * Tenant writes are wrapped in a transaction that sets the
 * app.current_org GUC so Postgres RLS allows them.
 */

import bcrypt from "bcryptjs";
import { PrismaClient, type RoleName, type Prisma } from "@prisma/client";
import { PERMISSIONS, ROLE_MATRIX } from "../lib/rbac/permissions";

const db = new PrismaClient();

async function main() {
  console.log("→ Seeding roles & permissions\u2026");
  await seedRolesAndPermissions();

  console.log("→ Seeding Gloford organization\u2026");
  const org = await seedOrganization();

  console.log("→ Seeding theme, site settings, nav, segments\u2026");
  await seedTenantContent(org.id);

  console.log("→ Seeding admin user\u2026");
  await seedAdminUser(org.id);

  console.log("\u2713 Seed complete");
}

// ───────────────────────────────────────────────────────────

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

async function seedOrganization() {
  return db.organization.upsert({
    where: { slug: "gloford" },
    update: {},
    create: {
      slug: "gloford",
      name: "Gloford",
      logoUrl: null,
      contactJson: {
        email: "info@gloford.org",
        phone: "",
        address: "",
      },
    },
  });
}

async function seedTenantContent(orgId: string) {
  await withTenant(orgId, async (tx) => {
    // Default theme (matches fallbacks in app/globals.css)
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
          primary: "212 92% 38%",
          "primary-fg": "0 0% 100%",
          secondary: "220 14% 96%",
          "secondary-fg": "224 71% 4%",
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
      update: {},
      create: {
        organizationId: orgId,
        siteName: "Gloford",
        contact: { email: "info@gloford.org", phone: "", address: "" },
        socials: {},
        seo: {
          title: "Gloford",
          description: "Community partnerships for health, education, and resilience.",
        },
      },
    });

    const headerLinks = [
      { label: "Home", href: "/", order: 0 },
      { label: "About", href: "/about", order: 1 },
      { label: "Programs", href: "/programs", order: 2 },
      { label: "Blog", href: "/blog", order: 3 },
      { label: "Events", href: "/events", order: 4 },
      { label: "Contact", href: "/contact", order: 5 },
    ];
    for (const l of headerLinks) {
      await tx.navItem.upsert({
        where: { id: `seed-header-${l.order}` },
        update: {},
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

    const systemSegments = [
      { slug: "donors", name: "Donors", description: "People who have donated at least once" },
      { slug: "youth", name: "Youth", description: "Young people engaged with Gloford programs" },
      { slug: "volunteers", name: "Volunteers", description: "Active volunteers" },
      { slug: "partners", name: "Partners", description: "Partner organizations and collaborators" },
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
          preferences: { locale: "en", timezone: "Africa/Nairobi" },
        },
      },
    },
  });

  const superAdmin = await db.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });

  await withTenant(orgId, async (tx) => {
    await tx.orgMembership.upsert({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
      update: { roleId: superAdmin.id },
      create: {
        organizationId: orgId,
        userId: user.id,
        roleId: superAdmin.id,
      },
    });
  });

  console.log(`  admin: ${email}`);
  if (password === "change-me-on-first-login") {
    console.log("  \u26a0 using default password. Set SEED_ADMIN_PASSWORD before running in prod.");
  }
}

/**
 * RLS-aware transaction for tenant inserts. Sets the session GUCs
 * the policies read, then runs `fn`.
 */
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
