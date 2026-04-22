import { runAsTenant } from "@/lib/tenant/context";

/**
 * Build the brand context used by email templates for a given org.
 * Tenant-scoped so the SiteSettings read passes RLS.
 *
 * Resilience: if the DB lookup fails or the row is missing, we fall
 * back to env-driven defaults. A failed brand resolve must never block
 * an email send — the system can still email from "Gloford" with no
 * logo and a default site URL.
 */
export async function buildBrand(orgId: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const defaultName = process.env.BRAND_NAME ?? "Gloford";
  const defaultLogo = process.env.BRAND_LOGO_URL;

  let settings: { siteName: string | null; logoUrl: string | null } | null = null;
  try {
    settings = await runAsTenant(orgId, (tx) =>
      tx.siteSettings.findUnique({
        where: { organizationId: orgId },
        select: { siteName: true, logoUrl: true },
      }),
    );
  } catch {
    // Lookup failed — use env defaults. Callers still get a valid brand.
    settings = null;
  }

  return {
    orgName: settings?.siteName ?? defaultName,
    siteUrl: origin,
    logoUrl: settings?.logoUrl ?? defaultLogo,
  };
}
