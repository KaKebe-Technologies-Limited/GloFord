-- Volunteer Opportunities
CREATE TABLE "VolunteerOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" JSONB NOT NULL DEFAULT '[]',
    "benefits" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VolunteerOpportunity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VolunteerOpportunity_slug_key" ON "VolunteerOpportunity"("slug");
CREATE INDEX "VolunteerOpportunity_isActive_idx" ON "VolunteerOpportunity"("isActive");

-- Volunteer Applications
CREATE TYPE "VolunteerAppStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE "VolunteerApplication" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "motivation" TEXT,
    "availability" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "status" "VolunteerAppStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VolunteerApplication_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VolunteerApplication_opportunityId_status_idx" ON "VolunteerApplication"("opportunityId", "status");
CREATE INDEX "VolunteerApplication_email_idx" ON "VolunteerApplication"("email");
ALTER TABLE "VolunteerApplication" ADD CONSTRAINT "VolunteerApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Contact Messages
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContactMessage_isRead_createdAt_idx" ON "ContactMessage"("isRead", "createdAt");
