-- Remove STRIPE and PAYPAL from PaymentProvider enum
-- First delete any existing rows that reference them
DELETE FROM "Donation" WHERE "provider" IN ('STRIPE', 'PAYPAL');
DELETE FROM "PaymentConfiguration" WHERE "provider" IN ('STRIPE', 'PAYPAL');
DELETE FROM "WebhookEvent" WHERE "provider" IN ('STRIPE', 'PAYPAL');

-- Create new enum type without STRIPE and PAYPAL
CREATE TYPE "PaymentProvider_new" AS ENUM ('PESAPAL', 'FLUTTERWAVE', 'MTN_MOMO', 'AIRTEL_MONEY');

-- Alter columns to use the new enum
ALTER TABLE "Donation" ALTER COLUMN "provider" TYPE "PaymentProvider_new" USING ("provider"::text::"PaymentProvider_new");
ALTER TABLE "PaymentConfiguration" ALTER COLUMN "provider" TYPE "PaymentProvider_new" USING ("provider"::text::"PaymentProvider_new");

-- Drop old enum and rename new one
DROP TYPE "PaymentProvider";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";

-- Add feature toggle columns to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "donationsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "campaignsEnabled" BOOLEAN NOT NULL DEFAULT true;
