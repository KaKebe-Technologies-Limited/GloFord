/**
 * Single-tenant compatibility shim.
 *
 * Earlier versions of this codebase were multi-tenant and used these
 * helpers to scope queries per-org via Postgres RLS + session GUCs.
 * The platform is now single-tenant (one org per deployment) so the
 * helpers collapse to thin wrappers around the default Prisma client.
 *
 * They exist only so existing call sites don't have to change their
 * shape in one giant PR. New code should call `db` directly.
 */
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type Actor = {
  userId: string;
  roleId: string;
  role: string;
  email: string;
};

/**
 * Run a block against the DB. The old "tenant transaction" semantics
 * are gone — this is just `db.$transaction` with a nicer name so the
 * service layer's intent reads clearly.
 */
export async function runWithTenant<T>(
  _actor: Actor,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(fn);
}

export async function runAsTenant<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(fn);
}

export async function runAsSystem<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return db.$transaction(fn);
}

export async function readWithTenant<T>(
  actor: Actor,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return runWithTenant(actor, fn);
}
