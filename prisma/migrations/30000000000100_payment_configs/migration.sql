-- ────────────────────────────────────────────────────────────
-- Payment provider configuration
-- Per-org, per-provider config with encrypted secrets.
-- ────────────────────────────────────────────────────────────

-- Extend the provider enum with the four new adapters.
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'PESAPAL';
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'FLUTTERWAVE';
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MTN_MOMO';
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'AIRTEL_MONEY';

CREATE TABLE IF NOT EXISTS "PaymentConfiguration" (
  "id"               TEXT PRIMARY KEY,
  "organizationId"   TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "provider"         "PaymentProvider" NOT NULL,
  "isEnabled"        BOOLEAN NOT NULL DEFAULT FALSE,
  "mode"             TEXT NOT NULL DEFAULT 'sandbox',
  "publicConfig"     JSONB NOT NULL DEFAULT '{}',
  "encryptedSecrets" TEXT,
  "lastVerifiedAt"   TIMESTAMP(3),
  "verifyError"      TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentConfiguration_organizationId_provider_key"
  ON "PaymentConfiguration" ("organizationId", "provider");

CREATE INDEX IF NOT EXISTS "PaymentConfiguration_organizationId_isEnabled_idx"
  ON "PaymentConfiguration" ("organizationId", "isEnabled");

-- RLS
ALTER TABLE "PaymentConfiguration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentConfiguration" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PaymentConfiguration_tenant" ON "PaymentConfiguration";
CREATE POLICY "PaymentConfiguration_tenant" ON "PaymentConfiguration"
  USING ("organizationId" = app_current_org())
  WITH CHECK ("organizationId" = app_current_org());
