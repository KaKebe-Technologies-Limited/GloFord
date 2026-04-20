import { db, type Db } from "@/lib/db";
import { Prisma, type RoleName } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

/**
 * An Actor is the authenticated principal for a request. Every service
 * call receives one; if null, the service refuses to run.
 */
export type Actor = {
  userId: string;
  orgId: string;
  roleId: string;
  role: RoleName;
  email: string;
};

export function requireActor(actor: Actor | null | undefined): asserts actor is Actor {
  if (!actor) throw new UnauthorizedError();
}

/**
 * Run a function inside a Postgres transaction with session-local GUCs
 * set so every query in the transaction is RLS-enforced against the
 * actor's organization.
 *
 * Security: the actor fields are validated (CUIDs + enum whitelist) before
 * being injected via SET LOCAL. We still use parameterized SET via SELECT
 * set_config(...) to avoid any string concatenation into SQL.
 */
export async function runWithTenant<T>(
  actor: Actor,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  assertSafeActor(actor);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_org',  ${actor.orgId},  true)`;
    await tx.$executeRaw`SELECT set_config('app.current_user', ${actor.userId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_role', ${actor.role},   true)`;
    return fn(tx);
  });
}

/**
 * For read paths that need the tenant GUC but don't need a transaction
 * for correctness. Uses $transaction for GUC isolation — session-level
 * GUCs would leak across pooled connections.
 */
export async function readWithTenant<T>(
  actor: Actor,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return runWithTenant(actor, fn);
}

function assertSafeActor(a: Actor) {
  const cuid = /^[a-z0-9]{20,40}$/i;
  if (!cuid.test(a.userId)) throw new ForbiddenError("Invalid actor.userId");
  if (!cuid.test(a.orgId)) throw new ForbiddenError("Invalid actor.orgId");
  if (!cuid.test(a.roleId)) throw new ForbiddenError("Invalid actor.roleId");
  const roles: RoleName[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];
  if (!roles.includes(a.role)) throw new ForbiddenError("Invalid actor.role");
}

/** Re-export db so services have one import. */
export { db };
export type { Db };
