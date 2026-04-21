import { db } from "@/lib/db";

/**
 * Build the brand context used by email templates for a given org.
 * Safe to call outside a tenant-scoped transaction — read-only on
 * the Organization + SiteSettings tables which are single-tenant keys.
 */
export async function buildBrand(orgId: string) {
  const settings = await db.siteSettings.findUnique({
    where: { organizationId: orgId },
    select: { siteName: true, logoUrl: true },
  });
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    orgName: settings?.siteName ?? "Gloford",
    siteUrl: origin,
    logoUrl: settings?.logoUrl ?? undefined,
  };
}
