# White-Label / Single-Tenant Refactor Plan

> Goal: **keep this codebase; deploy one instance per client.** Each client
> gets their own database, own domain, own branding. The code stays a single
> shared asset that you can fork or re-clone for each engagement.

Today the platform is multi-tenant: every row carries `organizationId`, RLS
policies enforce tenant isolation, and the admin UI is org-aware. That
model is correct and production-grade, but **it does not match how you'll
actually deploy it** if every NGO you serve is a separate engagement on its
own box. This doc plans the refactor from "multi-tenant host" →
"white-label app template."

---

## Current state (what works in our favor)

- **One Organization per deployment is already the common path.** The seed
  creates exactly one org (`gloford.org`). In production you'd do the
  same: seed one org on first migrate, then never add another.
- **Branding already lives in data.** `SiteSettings` (site name, logo,
  contact, socials, SEO) and `Theme` (colors, typography, radii, shadows)
  are editable at runtime from the admin UI. No code change needed to
  rebrand — just edit in the admin.
- **No org picker in URLs.** The public site has no `/org/<slug>/` prefix;
  it's all root-relative. The admin layout doesn't switch orgs either.
- **Payment secrets are per-org and encrypted at rest.** Already
  client-portable.
- **i18n is already locale-per-deployment.** Each client can pick any
  subset of `en / fr / sw` in `lib/i18n/config.ts`.

So the code is **mostly** there. The gap is: the runtime still
thinks "there could be multiple orgs", which costs you:

1. Every list query carries an `organizationId` filter. One migration
   mistake could leak cross-tenant data — except there is no "other"
   tenant in a single-client deploy, so the filter is pure overhead.
2. RLS policies enforce tenant isolation that will never be exercised,
   at the cost of a non-superuser role split (`gloford` + `gloford_app`)
   and a SYSTEM-bypass escape hatch for crons.
3. The admin UI shows "Organization" as a first-class concept in a
   couple of places (user management, audit log filter by actor's org).
4. Package naming, README, seed data all say "gloford" — not white-label.

None of these are urgent. But cumulatively they make the code "look
like a SaaS" when in practice each deployment is a standalone product.

---

## Target state

A single git repo that, when cloned and configured via env, becomes a
client-specific app. You can still fork it if a client needs custom
modules — that fork stays mergeable with upstream because the
customization points are centralized.

| Concern | Today (multi-tenant) | Target (white-label) |
|---|---|---|
| `organizationId` column | present on 23 tables | **keep, but set to a fixed value per deploy** |
| RLS policies | enforce per-tenant | keep as defense-in-depth; they trivially pass |
| Org resolution | every request resolves from session | resolved once at boot from env |
| Admin "users" scope | users belong to an org | users belong to THE org; no UI friction |
| Branding | editable at runtime | editable at runtime, **seeded from env at first migrate** |
| Public URL | root | root (no change) |
| Payment providers | enabled per org | enabled for THE org |
| Seed | creates Gloford org | creates org from `APP_ORG_NAME` / `APP_ORG_SLUG` env |
| Package name | `gloford` | `@kakebe/ngo-platform` (or similar) |

---

## Recommended approach: **soft single-tenant**

Don't drop the `organizationId` columns. Don't rewrite the RLS
policies. Instead:

1. At boot, resolve "the one org" from env and cache it.
2. Every call site that currently reads `actor.orgId` continues to do
   so — the value just happens to be a constant for the lifetime of
   the process.
3. Brand defaults come from env so a fresh deploy has working email +
   page titles before anyone logs into the admin.
4. Repo identity (package name, README, seed org, default admin email)
   becomes configurable.

This is a ~1 day refactor, not a 2-week migration. It preserves the
ability to go multi-tenant later (delete the env pin, re-enable org
switching) and keeps the defense-in-depth RLS layer working. The only
thing you give up is a theoretical ability to host multiple clients on
one instance — which you've already decided you don't want.

### Why not "hard" single-tenant (drop the column entirely)?

Cost/benefit is unfavorable:

- You'd rewrite **every Prisma query** in the codebase (170+ call sites).
- You'd redo **every RLS policy** (23 tables).
- You'd edit **every migration** or start fresh with a new init.
- The net win is ~5% runtime perf on indexed queries and a slightly
  simpler mental model.

Not worth the risk today. Revisit in 12 months if single-tenant
deploys are clearly permanent.

---

## Concrete phases

Each phase is a mergeable PR. You can stop at any phase — the product
stays working.

### Phase 1 — Tenant resolution shim · ~2h

**Outcome:** the code has a single source of truth for "the org". No
new features, no UI changes, no migrations.

1. Add `lib/tenant/current.ts`:

    ```ts
    import { cache } from "react";
    import { db } from "@/lib/db";
    import { runAsSystem } from "@/lib/tenant/context";

    /**
     * The single org this deployment serves. Resolved once per request
     * (React cache) from APP_ORG_SLUG. Created on first boot in dev if
     * missing; throws in prod so misconfiguration is loud.
     */
    export const getCurrentOrgId = cache(async (): Promise<string> => {
      const slug = process.env.APP_ORG_SLUG;
      if (!slug) throw new Error("APP_ORG_SLUG not set");
      const row = await runAsSystem((tx) =>
        tx.organization.findUnique({ where: { slug }, select: { id: true } }),
      );
      if (!row) throw new Error(`Organization "${slug}" not found — run migrate+seed first`);
      return row.id;
    });
    ```

2. Where call sites today do `const actor = await requireActorFromSession(); const orgId = actor.orgId;` — they can keep doing that. The value will now be the single-org id for every user. No changes needed.

3. Public routes that don't have a session (donate widget, public
   pages, subscribe form) stop guessing org from domain/host; they
   just call `getCurrentOrgId()`.

    Files affected (public-side only):
    - `app/(public)/donate/page.tsx` + `[slug]/page.tsx`
    - `app/(public)/events/*`
    - `app/(public)/[slug]/page.tsx` (cms pages)
    - `app/api/donations/[id]/status/route.ts`
    - `lib/actions/subscribers.ts` (public subscribe)

**What stays the same:** RLS migration, `runAsTenant`, `runAsSystem`,
every service function, every admin page, every Inngest function.

### Phase 2 — Env-driven brand defaults · ~1h

**Outcome:** a fresh clone + fresh DB boots with working branding
without anyone logging in.

1. Add these to `.env.example`:

    ```
    APP_ORG_SLUG="client-slug"
    APP_ORG_NAME="Client Display Name"
    APP_ADMIN_EMAIL="admin@client.org"
    BRAND_NAME="Client Display Name"          # mirrors APP_ORG_NAME for emails
    BRAND_LOGO_URL="https://client.org/logo.png"
    BRAND_PRIMARY_COLOR="#2563eb"
    ```

2. `prisma/seed.ts` reads them and seeds:
   - Organization row (idempotent — `upsert` by slug)
   - User with `APP_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`
   - SiteSettings row with `BRAND_NAME` + `BRAND_LOGO_URL`
   - Theme row with `BRAND_PRIMARY_COLOR` as the primary color token

3. `lib/mail/brand.ts` already uses env fallbacks (done in the
   resilience pass). Nothing more to change.

### Phase 3 — Repo identity + docs · ~1h

**Outcome:** the repo is client-agnostic. You can give it to a new
client's dev team without them asking "why does this say Gloford?"

1. Rename `package.json` from `gloford` → `@yourco/ngo-platform`
   (or whatever branding you sell under).
2. Move `gloford`-specific references into:
   - README (add a "White-label usage" section)
   - SECRETS / BACKUP runbooks (client-name-agnostic)
   - Seed script (reads from env)
3. Create `CLIENT-SETUP.md` — the one doc a new client engagement reads.
   It covers: fork or clone, configure env, deploy to Vercel/Fly, seed
   the DB, log in, rebrand the theme, point DNS.

### Phase 4 — Hide multi-org UI surface · ~1h (optional)

**Outcome:** the admin UI stops hinting that multi-tenancy is a feature.

1. `/admin/users` — remove any "across all orgs" messaging; users are
   implicitly scoped to THE org.
2. `/admin/system/audit` — drop the "actor.orgId" filter column if
   present.
3. Remove the i18n string `organization` if it isn't used anywhere
   user-facing.

None of this is functional; it's polish. Skip Phase 4 if the UI
already reads "this is a single-org app" without confusion.

### Phase 5 — Full single-tenant (deferred, don't do) · ~8h

This is the "drop `organizationId` columns" path. Don't tackle it
unless you're sure you'll never want multi-tenant and the modest
simplification is worth the migration risk.

If you ever do it:

1. New branch, generate a fresh init migration from a
   stripped-down `schema.prisma` (no `organizationId`, no `Organization`
   table).
2. Data migration: `psql` script that reads the old DB + writes the new
   one. You lose the RLS policies (fine — there's nothing to isolate).
3. Rewrite every `where: { organizationId: ... }` → `where: { ... }`.
4. Delete `lib/tenant/` entirely; services no longer need the GUC or
   runAsTenant wrappers.
5. Delete RLS migrations.

Net: a cleaner codebase, ~5% faster queries, but weeks of refactor
across 200+ files and a risky one-shot data migration. **Defer.**

---

## Recommended rollout

For the **current Gloford deployment**: stay exactly as-is. It's already
the white-label template — Gloford is just the first client.

For **the next client** you take on:

1. Fork the repo to `client-acme`.
2. Execute Phase 1 + 2 + 3 on the fork (total ~4 hours).
3. `pnpm db:seed` boots it as Acme Foundation.
4. Deploy to a fresh Vercel project + fresh Neon DB.
5. Rebrand from the admin UI (logo, colors, copy).
6. Point DNS.

Each client lives in their own fork. You backport bugfixes and new
features from the upstream template via normal git merges. Phase 1 + 2
are designed to survive merges from upstream because they only add
files / env vars, they don't rewrite existing code.

---

## Effort summary

| Phase | What | Time | Required? |
|---|---|---|---|
| 1 | Tenant resolution shim | 2h | yes (unblocks Phase 2/3) |
| 2 | Env-driven brand defaults | 1h | yes |
| 3 | Repo identity + docs | 1h | yes for the first client fork |
| 4 | Hide multi-org UI surface | 1h | optional polish |
| 5 | Full single-tenant DB | 8h+ | no — defer |

**Total to go white-label: ~4 hours of engineering work per client fork.**
No downtime, no data loss, reversible at any point.

---

## Open questions for you

1. **Fork per client, or single repo with branch-per-client?** Forks are
   cleaner for divergent customization (one client wants a custom
   module). Branches are cleaner if you expect minimal divergence.
   Default recommendation: **fork per client**, PRs upstream for
   generally-useful features.

2. **Shared infra or per-client Neon/Vercel?** Fully separate is the
   simplest security story (one client's outage can't hit another).
   Shared costs less. Default recommendation: **separate per client**
   while you're under 10 clients; revisit when scale forces consolidation.

3. **Branding editable by client or you?** If clients edit their own
   theme/logos in the admin UI, you don't need Phase 2's env seeding
   beyond first-boot sensible defaults. If you do it for them as a
   service, Phase 2 becomes less important (you'd just edit in the
   admin before handoff).

4. **Any client-requested modules (events module disabled, donations
   disabled, etc.)?** If yes, we'd add a per-client feature flag file
   (`config/modules.ts`) that toggles module visibility. Cheap; worth
   doing if you foresee 3+ clients wanting different module sets.

Ping me on any of the four and I'll sequence Phase 1–3 for implementation.
