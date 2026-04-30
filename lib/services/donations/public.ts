import { getBrand } from "@/config/brand";
import { listEnabledProviders } from "@/lib/services/payments/registry";
import { db } from "@/lib/db";

/**
 * Read-only helpers for the public donate page. Brand name comes from
 * env (BRAND_NAME); enabled providers come from PaymentConfiguration.
 * Respects the donationsEnabled / campaignsEnabled toggles from SiteSettings.
 */
export async function getPublicDonationContext() {
  const [providers, settings] = await Promise.all([
    listEnabledProviders(),
    db.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { donationsEnabled: true, campaignsEnabled: true },
    }),
  ]);

  return {
    org: { id: "singleton", name: getBrand().name },
    providers,
    donationsEnabled: settings?.donationsEnabled ?? true,
    campaignsEnabled: settings?.campaignsEnabled ?? true,
  };
}
