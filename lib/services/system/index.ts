import { runAsTenant, runAsSystem } from "@/lib/tenant/context";

export async function listAuditLogs(
  orgId: string,
  filter: { module?: string; userId?: string; take?: number } = {},
) {
  return runAsTenant(orgId, (tx) =>
    tx.auditLog.findMany({
      where: {
        organizationId: orgId,
        ...(filter.module && { module: filter.module }),
        ...(filter.userId && { userId: filter.userId }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(filter.take ?? 100, 500),
    }),
  );
}

export async function listAuditModules(orgId: string) {
  const rows = await runAsTenant(orgId, (tx) =>
    tx.auditLog.findMany({
      where: { organizationId: orgId },
      distinct: ["module"],
      select: { module: true },
      orderBy: { module: "asc" },
      take: 50,
    }),
  );
  return rows.map((r) => r.module);
}

export async function listVersions(
  orgId: string,
  filter: { entityType?: string; entityId?: string; take?: number } = {},
) {
  return runAsTenant(orgId, (tx) =>
    tx.version.findMany({
      where: {
        organizationId: orgId,
        ...(filter.entityType && { entityType: filter.entityType }),
        ...(filter.entityId && { entityId: filter.entityId }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(filter.take ?? 100, 500),
    }),
  );
}

export async function listVersionEntityTypes(orgId: string) {
  const rows = await runAsTenant(orgId, (tx) =>
    tx.version.findMany({
      where: { organizationId: orgId },
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
      take: 50,
    }),
  );
  return rows.map((r) => r.entityType);
}

export async function listDeadLetters(
  orgId: string,
  filter: { status?: "PENDING" | "RETRIED" | "RESOLVED" | "IGNORED"; take?: number } = {},
) {
  return runAsTenant(orgId, (tx) =>
    tx.deadLetter.findMany({
      where: {
        organizationId: orgId,
        ...(filter.status && { status: filter.status }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(filter.take ?? 100, 500),
    }),
  );
}

export async function listFeatureFlags(orgId: string) {
  // FeatureFlag is nullable-tenant: rows live either under an org or
  // globally (organizationId=null). The tenant policy denies NULL
  // rows when app.current_org is set, so global flags have to come
  // through a SYSTEM-scoped read. Tenant rows override globals by key.
  const [orgFlags, globalFlags] = await Promise.all([
    runAsTenant(orgId, (tx) =>
      tx.featureFlag.findMany({
        where: { organizationId: orgId },
        orderBy: [{ key: "asc" }],
      }),
    ),
    runAsSystem((tx) =>
      tx.featureFlag.findMany({
        where: { organizationId: null },
        orderBy: [{ key: "asc" }],
      }),
    ),
  ]);
  const byKey = new Map<string, (typeof orgFlags)[number]>();
  for (const f of globalFlags) byKey.set(f.key, f);
  for (const f of orgFlags) byKey.set(f.key, f);
  return Array.from(byKey.values()).sort((a, b) => a.key.localeCompare(b.key));
}
