-- AlterTable: Add A/B testing fields to Newsletter
ALTER TABLE "Newsletter" ADD COLUMN "subjectB" TEXT;
ALTER TABLE "Newsletter" ADD COLUMN "abTestPercent" INTEGER DEFAULT 20;
ALTER TABLE "Newsletter" ADD COLUMN "abWinner" TEXT;

-- AlterTable: Add metadata to NewsletterLog for variant tagging
ALTER TABLE "NewsletterLog" ADD COLUMN "metadata" JSONB;
