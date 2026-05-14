-- Fix orphaned foreign keys: add proper relations

-- Media.uploadedById → User
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Media_uploadedById_idx" ON "Media"("uploadedById");

-- Newsletter.createdById → User
ALTER TABLE "Newsletter" ADD CONSTRAINT "Newsletter_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Newsletter_createdById_idx" ON "Newsletter"("createdById");

-- CareerApplication.reviewedById → User
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "CareerApplication_reviewedById_idx" ON "CareerApplication"("reviewedById");

-- PartnerApplication.reviewedById → User
ALTER TABLE "PartnerApplication" ADD CONSTRAINT "PartnerApplication_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "PartnerApplication_reviewedById_idx" ON "PartnerApplication"("reviewedById");

-- Fix cascade rules: content → Media (SetNull instead of Restrict)
ALTER TABLE "Program" DROP CONSTRAINT IF EXISTS "Program_coverMediaId_fkey";
ALTER TABLE "Program" ADD CONSTRAINT "Program_coverMediaId_fkey"
  FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_coverMediaId_fkey";
ALTER TABLE "Post" ADD CONSTRAINT "Post_coverMediaId_fkey"
  FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS "Event_coverMediaId_fkey";
ALTER TABLE "Event" ADD CONSTRAINT "Event_coverMediaId_fkey"
  FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Fix cascade rules: Donation → Donor/Campaign (SetNull)
ALTER TABLE "Donation" DROP CONSTRAINT IF EXISTS "Donation_donorId_fkey";
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorId_fkey"
  FOREIGN KEY ("donorId") REFERENCES "Donor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Donation" DROP CONSTRAINT IF EXISTS "Donation_campaignId_fkey";
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Fix cascade rules: Campaign → Program (SetNull)
ALTER TABLE "Campaign" DROP CONSTRAINT IF EXISTS "Campaign_programId_fkey";
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ThemePreset index
CREATE INDEX "ThemePreset_builtIn_order_idx" ON "ThemePreset"("builtIn", "order");
