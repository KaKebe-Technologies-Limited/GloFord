import { db } from "@/lib/db";

export function listAuditLogs(
  filter: { module?: string; userId?: string; take?: number } = {},
) {
  return db.auditLog.findMany({
    where: {
      ...(filter.module && { module: filter.module }),
      ...(filter.userId && { userId: filter.userId }),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(filter.take ?? 100, 500),
  });
}

export async function listAuditModules() {
  const rows = await db.auditLog.findMany({
    distinct: ["module"],
    select: { module: true },
    orderBy: { module: "asc" },
    take: 50,
  });
  return rows.map((r) => r.module);
}

export function listVersions(
  filter: { entityType?: string; entityId?: string; take?: number } = {},
) {
  return db.version.findMany({
    where: {
      ...(filter.entityType && { entityType: filter.entityType }),
      ...(filter.entityId && { entityId: filter.entityId }),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(filter.take ?? 100, 500),
  });
}

export async function listVersionEntityTypes() {
  const rows = await db.version.findMany({
    distinct: ["entityType"],
    select: { entityType: true },
    orderBy: { entityType: "asc" },
    take: 50,
  });
  return rows.map((r) => r.entityType);
}

export function listDeadLetters(
  filter: { status?: "PENDING" | "RETRIED" | "RESOLVED" | "IGNORED"; take?: number } = {},
) {
  return db.deadLetter.findMany({
    where: {
      ...(filter.status && { status: filter.status }),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(filter.take ?? 100, 500),
  });
}

export function listFeatureFlags() {
  return db.featureFlag.findMany({ orderBy: [{ key: "asc" }] });
}
