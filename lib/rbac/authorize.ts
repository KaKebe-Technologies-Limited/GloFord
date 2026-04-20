import { cache } from "react";
import { db } from "@/lib/db";
import { ForbiddenError } from "@/lib/errors";
import type { Actor } from "@/lib/tenant/context";

type ResourceRef = {
  type: string;
  id?: string;
  ownerId?: string;
  organizationId?: string;
};

/**
 * Service-layer entry for every mutation. Throws ForbiddenError on deny.
 *
 * Resolution order:
 *   1. SUPER_ADMIN bypass.
 *   2. Cross-tenant refusal (actor.orgId vs resource.organizationId).
 *   3. Role permission check (scope = ORG | OWN).
 *   4. Per-resource override via ResourceGrant.
 */
export async function authorize(
  actor: Actor,
  action: string,
  resource: ResourceRef,
): Promise<void> {
  if (actor.role === "SUPER_ADMIN") return;

  if (resource.organizationId && resource.organizationId !== actor.orgId) {
    throw new ForbiddenError("Cross-tenant access denied");
  }

  const key = `${resource.type.toLowerCase()}.${action}`;
  const perm = await getRolePermission(actor.roleId, key);

  if (perm) {
    if (perm.scope === "ORG") return;
    if (perm.scope === "OWN" && resource.ownerId === actor.userId) return;
    if (perm.scope === "GLOBAL") return;
  }

  if (resource.id) {
    const grant = await getResourceGrant(actor.userId, resource.type, resource.id, action);
    if (grant) return;
  }

  throw new ForbiddenError(`${actor.email} cannot ${action} ${resource.type}`);
}

/** Cached for a single request via React cache() — safe to call repeatedly. */
export const getRolePermission = cache(async (roleId: string, key: string) => {
  const row = await db.rolePermission.findFirst({
    where: { roleId, permission: { key } },
    select: { permission: { select: { scope: true, key: true } } },
  });
  return row?.permission ?? null;
});

export const getResourceGrant = cache(
  async (userId: string, resourceType: string, resourceId: string, action: string) => {
    const grant = await db.resourceGrant.findUnique({
      where: {
        userId_resourceType_resourceId_action: { userId, resourceType, resourceId, action },
      },
      select: { expiresAt: true },
    });
    if (!grant) return null;
    if (grant.expiresAt && grant.expiresAt < new Date()) return null;
    return grant;
  },
);

/** Decorative UI helper (never the enforcement boundary). */
export async function can(
  actor: Actor | null,
  action: string,
  resource: ResourceRef,
): Promise<boolean> {
  if (!actor) return false;
  try {
    await authorize(actor, action, resource);
    return true;
  } catch {
    return false;
  }
}
