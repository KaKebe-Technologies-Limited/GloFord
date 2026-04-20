import { db } from "@/lib/db";
import { listEnabledProviders } from "@/lib/services/payments/registry";

/**
 * Read-only helpers that the public donate page uses. No RBAC,
 * no RLS context — these run against the DB as the unauth'd donor.
 * Their queries are scoped to the single active org (v1 launch).
 */

export async function getPublicDonationContext() {
  const org = await db.organization.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  if (!org) return null;
  const providers = await listEnabledProviders(org.id);
  return { org, providers };
}
