import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 50;

// ─── Audit Logs ─────────────────────────────────────────────

export type AuditFilter = {
  module?: string;
  userId?: string;
  action?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
  cursor?: string;
};

export async function listAuditLogs(filter: AuditFilter = {}) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filter.module) where.module = filter.module;
  if (filter.userId) where.userId = filter.userId;
  if (filter.action) where.action = { contains: filter.action, mode: "insensitive" };
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) where.createdAt.gte = new Date(filter.from);
    if (filter.to) where.createdAt.lte = new Date(filter.to);
  }

  const rows = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(filter.cursor && { cursor: { id: filter.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor, hasMore };
}

export async function countAuditLogs(filter: Omit<AuditFilter, "cursor"> = {}) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filter.module) where.module = filter.module;
  if (filter.userId) where.userId = filter.userId;
  if (filter.action) where.action = { contains: filter.action, mode: "insensitive" };
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) where.createdAt.gte = new Date(filter.from);
    if (filter.to) where.createdAt.lte = new Date(filter.to);
  }
  return db.auditLog.count({ where });
}

export async function getAuditLogDetail(id: string) {
  return db.auditLog.findUnique({ where: { id } });
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

// ─── Versions ───────────────────────��───────────────────────

export type VersionFilter = {
  entityType?: string;
  entityId?: string;
  cursor?: string;
};

export async function listVersions(filter: VersionFilter = {}) {
  const where: Prisma.VersionWhereInput = {};
  if (filter.entityType) where.entityType = filter.entityType;
  if (filter.entityId) where.entityId = filter.entityId;

  const rows = await db.version.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(filter.cursor && { cursor: { id: filter.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor, hasMore };
}

export async function getVersionDetail(id: string) {
  return db.version.findUnique({ where: { id } });
}

export async function getVersionPair(id: string) {
  const current = await db.version.findUnique({ where: { id } });
  if (!current) return null;

  // Find the previous version for diff comparison
  const previous = await db.version.findFirst({
    where: {
      entityType: current.entityType,
      entityId: current.entityId,
      version: current.version - 1,
    },
  });

  return { current, previous };
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

// ─── Dead Letters ────────────────────────���──────────────────

export type DeadLetterFilter = {
  status?: "PENDING" | "RETRIED" | "RESOLVED" | "IGNORED";
  source?: string;
  from?: string;
  to?: string;
  cursor?: string;
};

export async function listDeadLetters(filter: DeadLetterFilter = {}) {
  const where: Prisma.DeadLetterWhereInput = {};
  if (filter.status) where.status = filter.status;
  if (filter.source) where.source = filter.source;
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) where.createdAt.gte = new Date(filter.from);
    if (filter.to) where.createdAt.lte = new Date(filter.to);
  }

  const rows = await db.deadLetter.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(filter.cursor && { cursor: { id: filter.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor, hasMore };
}

export async function countPendingDeadLetters() {
  return db.deadLetter.count({ where: { status: "PENDING" } });
}

export async function getDeadLetterDetail(id: string) {
  return db.deadLetter.findUnique({ where: { id } });
}

// ─── Feature Flags ──────────────────────────────────────────

export function listFeatureFlags() {
  return db.featureFlag.findMany({ orderBy: [{ key: "asc" }] });
}
