# Backup & Restore Runbook

This project persists all non-media state in a single Postgres database. The
authoritative backup artifact is a `pg_dump`. Media (R2) is backed up separately
by Cloudflare.

## What to back up

| Component | Backup method | Frequency |
|---|---|---|
| Postgres (all tables) | `pg_dump` → offsite storage | Hourly incremental, daily full |
| Payment secrets | Encrypted in `PaymentConfiguration`; the DB backup covers them | — |
| Cloudflare R2 media | R2 object versioning + cross-region replication | Continuous |
| Application code | Git (origin = source of truth) | On push |
| Env vars / secrets | Vaulted in deployment platform (Vercel / Fly / Render) | — |

Do **not** back up `node_modules`, `.next/`, or Docker volumes directly — they
are regenerable.

## Daily full backup (production)

The production Postgres is run as a managed service (Neon in this project).
Neon takes point-in-time backups automatically. Still, an operator-controlled
dump gives you a portable artifact:

```bash
# From anywhere with DIRECT_URL set to the production URL.
pg_dump \
  --format=custom \
  --no-owner --no-acl \
  --file="gloford-$(date +%Y%m%d-%H%M).dump" \
  "$DIRECT_URL"
```

Upload the resulting `.dump` file to your offsite storage (S3/R2/GCS). Keep at
least 30 daily, 12 monthly, and 7 yearly snapshots.

## Local dev backup

The local stack's DB volume is called `gloford_db-data`. To snapshot it:

```bash
docker compose exec -T db pg_dump \
  --format=custom --no-owner --no-acl \
  -U gloford -d gloford \
  > gloford-local-$(date +%Y%m%d).dump
```

## Restore

### Into a fresh Postgres

```bash
# Create the target DB if it doesn't exist.
createdb -h <host> -U <user> gloford

# Restore.
pg_restore \
  --no-owner --no-acl \
  --clean --if-exists \
  --dbname="$DIRECT_URL" \
  gloford-YYYYMMDD-HHMM.dump
```

### Into the local docker stack

```bash
docker compose up -d db
docker compose exec -T db pg_restore \
  --no-owner --no-acl --clean --if-exists \
  -U gloford -d gloford \
  < gloford-local-YYYYMMDD.dump
```

## Post-restore checks

After any restore, run:

```bash
pnpm prisma migrate deploy      # apply any migrations the dump didn't cover
pnpm db:seed                    # idempotent — will no-op if data already exists
```

Then spot-check:

- `/admin/system/health` should report green on the Database card.
- `/admin/system/audit` should show an entry for `system.restore` if you
  recorded one manually.
- A donation on the donate page should succeed end-to-end (uses a test card
  against Stripe test mode).

## Encryption key handling

`ENCRYPTION_KEY` encrypts the `PaymentConfiguration.encryptedSecrets` column.
If the key is lost, **payment secrets cannot be recovered** — operators must
re-enter provider API keys in the admin. Treat this key like a root credential:

- Store in your secrets manager (1Password, AWS Secrets Manager, Vault).
- Rotate only during a planned maintenance window (re-encrypts every row).
- Never commit to the repo or pass via `docker run -e …` where it may be
  captured in shell history.

## Disaster recovery drill

Run at least quarterly:

1. Spin up a clean Postgres (fresh Docker container, isolated DB).
2. Restore yesterday's production dump.
3. Point a dev build at it, run `pnpm db:seed`, boot the app.
4. Confirm `/admin/dashboard` shows non-zero KPIs.
5. Document the wall-clock recovery time in your runbook log.

If step 4 fails, the backup is corrupt or missing data — investigate before
the next production incident.

---

# Secret Rotation Runbook

Rotate on a fixed cadence (quarterly) and immediately after any suspected
compromise. Each section lists what, where, and how to roll without downtime.

## General principles

- **Never** rotate provider live keys and test keys in the same change — roll
  one environment at a time.
- Use your deployment platform's env-var "draft" mechanism (Vercel's preview
  env, Fly's `set --stage`, etc.) to stage the new value before activating it.
- After rotating, smoke-test the end-to-end flow for that provider in
  production (one real test donation / one real test email).
- Log the rotation in your internal runbook: date, who, reason, provider,
  env tier.

## `AUTH_SECRET` (Auth.js)

Rotating this invalidates every active session — users have to sign in again.

```bash
# Generate
openssl rand -base64 32
```

Update `AUTH_SECRET` in your deployment platform, redeploy, then **clear the
cookies on at least one test account** and verify login still works.

## `ENCRYPTION_KEY` (payment-provider secrets at rest)

This key is symmetric and encrypts rows in `PaymentConfiguration.encryptedSecrets`.
Rotating it requires **re-encrypting existing rows** in the same change.

Zero-downtime recipe:

1. Generate the new key: `openssl rand -base64 32`.
2. In a one-off script (not committed — use a scratch notebook), load
   current rows, decrypt with the old key, re-encrypt with the new, write
   back. Do it transactionally; don't leave the table half-converted.
3. Deploy the new `ENCRYPTION_KEY` value.
4. Purge the old key from every vault you use.

If the key was **already compromised**, consider the payment secrets also
compromised — rotate provider keys in the next section before bringing the
new ENCRYPTION_KEY live.

## Payment provider keys

Rotate these in the **provider's dashboard**, then paste into the Gloford
admin UI at `/admin/settings/payments/<provider>`. The admin form re-encrypts
the value with the current ENCRYPTION_KEY before persisting — no SQL needed.

| Provider | Dashboard | What to rotate |
|---|---|---|
| Stripe | Developers → API keys | Secret key + webhook signing secret |
| Flutterwave | Settings → API | Secret key + webhook hash (set in UI **and** as `FLUTTERWAVE_WEBHOOK_HASH` env var) |
| Pesapal | Console → Merchant Settings | Consumer key + consumer secret |
| MTN MoMo | Developer portal | Subscription key + API user/API key pair |
| Airtel Money | Developer portal | Client ID + client secret |

**Webhook signing secrets** (Stripe `STRIPE_WEBHOOK_SECRET`, Resend
`RESEND_WEBHOOK_SECRET`, Flutterwave `FLUTTERWAVE_WEBHOOK_HASH`, MTN MoMo
`MTN_MOMO_CALLBACK_SECRET`, Airtel `AIRTEL_MONEY_CALLBACK_SECRET`) live as
env vars, not in the DB. Roll them separately:

1. Generate the new secret in the provider's dashboard.
2. Update the corresponding env var in your deployment platform.
3. Redeploy.
4. Send a test webhook from the provider's dashboard and verify
   `/admin/system/audit` shows `WebhookEvent.processedAt` filled in.
5. Revoke the old secret.

## `RESEND_API_KEY`

Resend keys are tied to a single account. Rotation:

1. Create a new restricted key in the Resend dashboard (scope: "Send only"
   if you don't need their API for anything else).
2. Set `RESEND_API_KEY` in the deployment platform, redeploy.
3. Trigger a test newsletter from admin → verify it reaches a test inbox.
4. Revoke the old key in the Resend dashboard.

## Database credentials (`DATABASE_URL` / `DIRECT_URL`)

Two-role setup: `gloford` (superuser) runs migrations, `gloford_app`
(NOSUPERUSER NOBYPASSRLS) runs the app. Rotate each independently.

**Rotating `gloford_app`** (no downtime if pooled):

```sql
ALTER ROLE gloford_app WITH PASSWORD '<new>';
```

Update `DATABASE_URL` in your deployment platform, redeploy. Active
connections in the pool will fail over to the new password at their next
reconnect.

**Rotating `gloford`** is a maintenance event — migrations are the only
thing that uses it and they run at deploy time:

1. Schedule a maintenance window (even if short).
2. `ALTER ROLE gloford WITH PASSWORD '<new>';`
3. Update `DIRECT_URL`.
4. Verify the next deploy's `prisma migrate deploy` step succeeds.

## `AUTH_GOOGLE_SECRET` (or any OAuth app)

Rotate the OAuth client secret in Google Cloud Console. Google keeps the old
secret working for ~6 hours after you create a new one — long enough to
deploy the new env var without a gap.

## After rotation

- Grep audit logs for `login.failed` / `webhook.verify_failed` spikes in the
  hour after rollout — it catches consumers you forgot to update.
- Update the "last rotated" column in your runbook.
- If the rotation was in response to a suspected compromise, also rotate:
  - `AUTH_SECRET` (invalidates sessions)
  - `ENCRYPTION_KEY` (see recipe above)
  - Every provider key in the table above
  - Any Personal Access Tokens in GitHub / deploy platform / monitoring.
