import { db } from "@/lib/db";
import { getBrand } from "@/config/brand";

/**
 * Brand context for email templates. Single-tenant: reads the one
 * SiteSettings row; if it's missing, env defaults ship instead so
 * emails still render with working branding before anyone has logged
 * into the admin.
 */
export async function buildBrand() {
  const brand = getBrand();
  let settings: { siteName: string | null; logoUrl: string | null } | null = null;
  try {
    settings = await db.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { siteName: true, logoUrl: true },
    });
  } catch {
    settings = null;
  }
  return {
    orgName: settings?.siteName ?? brand.name,
    siteUrl: brand.siteUrl,
    logoUrl: settings?.logoUrl ?? brand.logoUrl ?? undefined,
  };
}
