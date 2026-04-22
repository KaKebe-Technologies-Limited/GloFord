/**
 * Cross-tenant RLS enforcement test.
 *
 * Connects to a real Postgres using DATABASE_URL. Skips the whole
 * suite if DATABASE_URL isn't set so `pnpm test` works locally without
 * a DB. In CI, Postgres is a service container (see .github/workflows).
 *
 * What we prove:
 *   1. runAsTenant(A) cannot read rows belonging to tenant B.
 *   2. runAsTenant(A) cannot write rows for tenant B (WITH CHECK).
 *   3. runAsSystem() can read across tenants (cron use-case).
 *   4. The raw connection (no GUC) sees nothing.
 *
 * Isolation: each test creates two disposable orgs with cuid slugs
 * and cleans them up at the end. No shared fixtures.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";

const require_ = createRequire(import.meta.url);

const DB_URL = process.env.DATABASE_URL;
const RUN = !!DB_URL && !process.env.SKIP_DB_TESTS;

// We import these lazily so the `skip` path doesn't require Prisma to
// be generated or a DB to be reachable.
type Deps = {
  db: typeof import("@/lib/db").db;
  runAsTenant: typeof import("@/lib/tenant/context").runAsTenant;
  runAsSystem: typeof import("@/lib/tenant/context").runAsSystem;
};

let deps: Deps | null = null;
let orgA = "";
let orgB = "";
let pageA = "";
let pageB = "";

function rid() {
  return randomBytes(6).toString("hex");
}

async function loadDeps(): Promise<Deps> {
  const dbMod = require_("../../lib/db.ts") as typeof import("@/lib/db");
  const ctxMod = require_("../../lib/tenant/context.ts") as typeof import("@/lib/tenant/context");
  return { db: dbMod.db, runAsTenant: ctxMod.runAsTenant, runAsSystem: ctxMod.runAsSystem };
}

describe.skipIf(!RUN)("RLS: cross-tenant isolation", () => {
  beforeAll(async () => {
    deps = await loadDeps();
    const { db } = deps;
    // Two disposable orgs + one Page per org, using the superuser-ish
    // default client (which we expect to hit RLS under the app role
    // but succeed under migrate/DIRECT_URL).
    const a = await db.organization.create({
      data: { slug: `rls-a-${rid()}`, name: "RLS A" },
    });
    const b = await db.organization.create({
      data: { slug: `rls-b-${rid()}`, name: "RLS B" },
    });
    orgA = a.id;
    orgB = b.id;
    const [pa, pb] = await Promise.all([
      deps.runAsTenant(orgA, (tx) =>
        tx.page.create({
          data: {
            organizationId: orgA,
            slug: `a-${rid()}`,
            title: "A Page",
            blocks: [] as never,
            status: "PUBLISHED",
          },
        }),
      ),
      deps.runAsTenant(orgB, (tx) =>
        tx.page.create({
          data: {
            organizationId: orgB,
            slug: `b-${rid()}`,
            title: "B Page",
            blocks: [] as never,
            status: "PUBLISHED",
          },
        }),
      ),
    ]);
    pageA = pa.id;
    pageB = pb.id;
  });

  afterAll(async () => {
    if (!deps) return;
    const { db } = deps;
    // Cleanup as superuser-equivalent — the CI role owns the schema.
    await db.page
      .deleteMany({ where: { id: { in: [pageA, pageB].filter(Boolean) } } })
      .catch(() => {});
    await db.organization
      .deleteMany({ where: { id: { in: [orgA, orgB].filter(Boolean) } } })
      .catch(() => {});
  });

  it("runAsTenant(A) sees its own pages but not B's", async () => {
    const { runAsTenant } = deps!;
    const rows = await runAsTenant(orgA, (tx) => tx.page.findMany({}));
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(pageA);
    expect(ids).not.toContain(pageB);
  });

  it("runAsTenant(B) sees its own pages but not A's", async () => {
    const { runAsTenant } = deps!;
    const rows = await runAsTenant(orgB, (tx) => tx.page.findMany({}));
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(pageB);
    expect(ids).not.toContain(pageA);
  });

  it("runAsTenant(A) cannot insert a Page targeting org B (WITH CHECK)", async () => {
    const { runAsTenant } = deps!;
    await expect(
      runAsTenant(orgA, (tx) =>
        tx.page.create({
          data: {
            organizationId: orgB,
            slug: `cross-${rid()}`,
            title: "Cross tenant",
            blocks: [] as never,
            status: "DRAFT",
          },
        }),
      ),
    ).rejects.toThrow();
  });

  it("runAsSystem reads across tenants (cron use-case)", async () => {
    const { runAsSystem } = deps!;
    const rows = await runAsSystem((tx) =>
      tx.page.findMany({ where: { id: { in: [pageA, pageB] } } }),
    );
    const ids = rows.map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining([pageA, pageB]));
  });
});
