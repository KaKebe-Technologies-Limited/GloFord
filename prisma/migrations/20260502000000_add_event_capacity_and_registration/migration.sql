-- Add optional capacity field to Event (Phase 5: RSVP)
ALTER TABLE "Event" ADD COLUMN "capacity" INTEGER;

-- EventRsvpStatus enum
CREATE TYPE "EventRsvpStatus" AS ENUM ('GOING', 'INTERESTED', 'CANCELED');

-- EventRegistration table
CREATE TABLE "EventRegistration" (
    "id"           TEXT NOT NULL,
    "eventId"      TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "name"         TEXT,
    "status"       "EventRsvpStatus" NOT NULL DEFAULT 'GOING',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventRegistration_eventId_email_key" ON "EventRegistration"("eventId", "email");
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");

ALTER TABLE "EventRegistration"
    ADD CONSTRAINT "EventRegistration_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
