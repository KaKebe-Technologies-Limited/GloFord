# Client setup

This codebase is a **white-label NGO platform**. Every deployment serves one client. To launch for a new client:

## 1. Clone the template

```bash
git clone git@github.com:yourco/ngo-platform.git client-acme
cd client-acme
git remote rename origin upstream
git remote add origin git@github.com:yourco/client-acme.git
git push -u origin main
```

Keeping `upstream` lets you pull platform improvements with `git fetch upstream && git merge upstream/main`.

## 2. Configure `.env`

Copy `.env.example` and fill in the client's values. The minimum required to boot is:

```bash
# Identity + branding
BRAND_NAME="Acme Foundation"
BRAND_PRIMARY_COLOR="#2563eb"
NEXT_PUBLIC_APP_URL="https://give.acme.org"

# Admin credentials (change password after first login)
SEED_ADMIN_EMAIL="admin@acme.org"
SEED_ADMIN_PASSWORD="generate-a-strong-one"

# Database (own Neon project per client)
DATABASE_URL="postgresql://…"
DIRECT_URL="postgresql://…"

# Auth / encryption secrets — generate fresh per client
AUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
AUTH_URL="https://give.acme.org"
```

See `.env.example` for the full list with comments.

## 3. Provision infrastructure

Per client you need:

- **Postgres** — separate Neon project (or your managed provider). Create the database + user before setting `DATABASE_URL`.
- **Hosting** — Vercel / Fly / Render. Point it at the new fork.
- **R2 / S3 bucket** (optional, for media uploads) — one bucket per client.
- **Resend** (optional, for email) — new API key + verified sending domain.
- **Sentry** (optional) — new project for clean error segregation.
- **Payment provider accounts** — Stripe, Flutterwave, Pesapal, MTN MoMo, Airtel Money as relevant for the client's markets.

## 4. Run migrations + seed

```bash
pnpm install
pnpm prisma migrate deploy
pnpm db:seed
```

The seed reads `BRAND_NAME`, `BRAND_LOGO_URL`, `BRAND_PRIMARY_COLOR`, and `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` to bootstrap:

- Single `SiteSettings` row with the client's name
- Single `Theme` row with their primary color token
- All `Role` + `Permission` rows wired to the `ROLE_MATRIX`
- First admin user (SUPER_ADMIN)
- Default nav items (Programs, Blog, Events, Donate, About, Contact)
- System segments (Donors, Volunteers)

Re-running the seed is idempotent.

## 5. Deploy

```bash
git push
```

On Vercel, trigger the deploy and wait for the first build. On Fly:

```bash
fly launch
fly secrets import < .env.production
fly deploy
```

## 6. First login and rebrand

Go to `https://<your-url>/login` and sign in with `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`. Immediately:

1. **Change the admin password** — profile → change password.
2. **Upload the client's logo** via the admin → Settings → Site.
3. **Tweak theme tokens** in admin → Theme (colors, typography, radii).
4. **Configure payment providers** in admin → Settings → Payments (paste API keys — they're encrypted with `ENCRYPTION_KEY`).
5. **Invite other admins** via admin → Users.

## 7. Point DNS

Configure the client's domain (`give.acme.org` or their TLD) to point at your hosting provider. Set `NEXT_PUBLIC_APP_URL` and `AUTH_URL` to the production domain and redeploy.

---

## Updating from upstream

When the platform template ships a bugfix or new feature:

```bash
git fetch upstream
git merge upstream/main
# Resolve any conflicts (usually none if you only customized env values)
git push
```

Client-specific customization lives in:

- `.env` / `.env.production` — env values only, never committed.
- `prisma/seed.ts` — only if you added client-specific seed data.
- `config/brand.ts` — env-driven, should rarely need edits.

Avoid forking service logic. If a client needs a module others don't, prefer a **feature flag** (admin → Feature flags) over a code fork.

---

## Common troubleshooting

**Seed fails with `Organization not found`** — the schema no longer has Organizations. If you see this, your fork is on the multi-tenant branch; merge from upstream.

**Admin login 401 loops** — check `AUTH_URL` matches your deployed URL and `AUTH_SECRET` is set.

**Emails don't send** — check `RESEND_API_KEY` + `MAIL_FROM` domain is verified in Resend.

**Theme doesn't apply after edit** — Next.js caches theme tokens for 1h; run `revalidateTag("theme")` from the admin or wait. Production rebuilds always pick up the latest.
