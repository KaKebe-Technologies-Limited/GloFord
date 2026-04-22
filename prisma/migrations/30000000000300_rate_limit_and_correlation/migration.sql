-- Rate limiting: fixed-window counter keyed by (bucket, identifier, windowEnd).
CREATE TABLE "RateLimitHit" (
  "id"         TEXT NOT NULL,
  "bucket"     TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "count"      INTEGER NOT NULL DEFAULT 0,
  "windowEnd"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitHit_bucket_identifier_windowEnd_key"
  ON "RateLimitHit" ("bucket", "identifier", "windowEnd");
CREATE INDEX "RateLimitHit_bucket_identifier_idx"
  ON "RateLimitHit" ("bucket", "identifier");
CREATE INDEX "RateLimitHit_windowEnd_idx"
  ON "RateLimitHit" ("windowEnd");

-- Belt-and-braces index for the audit correlation column (already exists
-- from the init migration, so this is a no-op on a fresh DB; IF NOT EXISTS
-- keeps re-runs safe on any prior deploy).
CREATE INDEX IF NOT EXISTS "AuditLog_correlationId_like_idx"
  ON "AuditLog" ("correlationId");
