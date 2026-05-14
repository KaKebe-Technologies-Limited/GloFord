-- Add missing preferences column to Subscriber table
-- This column was defined in the Prisma schema but never migrated to the database
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "preferences" JSONB NOT NULL DEFAULT '{"newsletters":true,"campaigns":true,"events":true}'::jsonb;
