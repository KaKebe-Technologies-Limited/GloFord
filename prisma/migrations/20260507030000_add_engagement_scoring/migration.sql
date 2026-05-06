-- AlterTable: Add engagement scoring fields to Subscriber
ALTER TABLE "Subscriber" ADD COLUMN "engagementScore" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Subscriber" ADD COLUMN "lastEngagedAt" TIMESTAMP(3);
