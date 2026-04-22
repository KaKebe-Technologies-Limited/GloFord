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

### Seed safety

The seed script accepts admin credentials only through env vars — never via
flags or files that could land in shell history. For any environment that is
not a throwaway dev loop:

1. **Always set `SEED_ADMIN_PASSWORD`** to a unique strong value before running
   `pnpm db:seed`. The seed prints a warning if you run with the built-in
   default (`change-me-on-first-login`).
2. **Generate `ENCRYPTION_KEY` once per environment** with
   `openssl rand -base64 32`. This key encrypts payment-provider secrets at
   rest in `PaymentConfiguration.encryptedSecrets`. If lost, stored provider
   API keys cannot be decrypted and must be re-entered manually in the admin.
3. **Generate `AUTH_SECRET`** similarly and keep it out of the repo. Rotating
   it signs out every active session — plan accordingly.
4. After the first successful sign-in, **delete** `SEED_ADMIN_PASSWORD` from
   your runtime env. The seed is idempotent; it only creates the admin if one
   doesn't exist. It does not reset an existing admin's password.

See [BACKUP.md](./BACKUP.md) for the production backup/restore runbook.

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
| `pnpm test` | Run Vitest unit tests once |
| `pnpm test:watch` | Watch-mode tests |

## Docker

A multi-stage Dockerfile + a three-service compose stack live in the repo:

```bash
docker compose up -d db                # start Postgres
docker compose run --rm migrate        # apply migrations + seed
docker compose up --build app inngest  # build image and bring up app + Inngest dev server
```

- App: <http://localhost:3000>
- Inngest dev UI: <http://localhost:8288>
- Postgres: `localhost:5433` (mapped from 5432 in the container)

The compose file lives at [`compose.yaml`](./compose.yaml) (the modern canonical
filename Docker recommends; `docker-compose.yml` is the legacy name, both are
recognized by `docker compose`).
