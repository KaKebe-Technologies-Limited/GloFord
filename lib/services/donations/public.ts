import { getBrand } from "@/config/brand";
import { listEnabledProviders } from "@/lib/services/payments/registry";

/**
 * Read-only helpers for the public donate page. Brand name comes from
 * env (BRAND_NAME); enabled providers come from PaymentConfiguration.
 */
export async function getPublicDonationContext() {
  const providers = await listEnabledProviders();
  return {
    org: { id: "singleton", name: getBrand().name },
    providers,
  };
}
