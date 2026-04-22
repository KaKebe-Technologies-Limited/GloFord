import { db } from "@/lib/db";
import { runAsTenant } from "@/lib/tenant/context";

/**
 * Public-facing event queries. Tenant-scoped so RLS still applies
 * (only returns events in the given org), with isPublic=true filters
 * layered on top.
 */

export function listPublicEvents(orgId: string) {
  return runAsTenant(orgId, (tx) =>
    tx.event.findMany({
      where: { organizationId: orgId, isPublic: true },
      orderBy: { startsAt: "asc" },
      include: { cover: { select: { url: true, alt: true } } },
    }),
  );
}

export function getPublicEvent(orgId: string, eventSlug: string) {
  return runAsTenant(orgId, (tx) =>
    tx.event.findFirst({
      where: { organizationId: orgId, slug: eventSlug, isPublic: true },
      include: { cover: { select: { url: true, alt: true } } },
    }),
  );
}

export async function listPublicEventsByOrg(orgSlug: string) {
  // Organization is not RLS-gated (it's the tenant root).
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  });
  if (!org) return [];
  return listPublicEvents(org.id);
}

export async function getPublicEventBySlug(orgSlug: string, eventSlug: string) {
  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  });
  if (!org) return null;
  return getPublicEvent(org.id, eventSlug);
}
