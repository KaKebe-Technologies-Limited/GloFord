# Gloford

Multi-tenant NGO platform — dynamic public site, admin dashboard, donations, newsletter, and email automation. Replaces the static gloford.org with a scalable, enterprise-ready foundation.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Language | TypeScript 5.7 |
| DB | PostgreSQL on Neon (RLS-enforced multi-tenancy) |
| ORM | Prisma 6 |
| Auth | Auth.js v5 (credentials + Google) |
| Jobs | Inngest (sequences, retries, audit/version fan-out) |
| Email | Resend + React Email |
| Payments | Stripe, PayPal, Mobile Money |
| Storage | Cloudflare R2 |
| Styling | Tailwind CSS 4 (CSS-variable theme tokens) |
| i18n | next-intl |

## Quick start

```bash
pnpm install
cp .env.example .env.local   # fill in secrets
pnpm db:migrate              # applies schema + RLS policies
pnpm db:seed                 # creates Gloford org + admin user
pnpm dev                     # http://localhost:3000
pnpm inngest:dev             # in another terminal
```

Default admin credentials come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env.local`.

## Architecture

See the blueprint in conversation history. Key invariants:

- **Multi-tenancy:** every tenant-scoped row has `organizationId`; Postgres RLS enforced via session GUCs (`app.current_org`, `app.current_user`, `app.current_role`).
- **Service layer:** UI/API never touch Prisma. All writes go through `lib/services/<module>/*` via the `createService()` wrapper: validate -> authorize -> transact -> version -> audit -> emit.
- **Module communication:** event-first via Inngest for cross-module side-effects (donations -> segments -> emails). Direct calls only for content/media.
- **Consistency:** strong for payments/users/RBAC; eventual for audit, versions, emails, activity.

## Phases

1. **Foundation** (this phase) — Next.js + Prisma schema + RLS + Auth.js + Inngest + theme + shells + seed
2. Content — Pages, Programs, Posts, Media, BlockEditor, versioning
3. Donations — providers, campaigns, webhooks, widget
4. Newsletter + email automation — subscribers, segments, campaigns, sequences
5. Events — event CRUD, announcements, reminders
6. Observability — audit viewer, versions UI, dead-letter retry, feature flags, health
7. Polish — a11y audit, E2E, CI/CD, Neon branches

## Scripts

| | |
|---|---|
| `pnpm dev` | Dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm typecheck` | TS without emit |
| `pnpm lint` | ESLint (includes boundaries + a11y) |
| `pnpm db:migrate` | Apply Prisma migrations locally |
| `pnpm db:deploy` | Apply migrations in CI/prod |
| `pnpm db:seed` | Seed roles, permissions, Gloford org, default theme |
| `pnpm db:studio` | Prisma Studio |
| `pnpm inngest:dev` | Local Inngest dev server |
