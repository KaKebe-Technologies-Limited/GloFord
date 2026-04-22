-- Add the foreign-key relation between Event.coverMediaId and Media.id.
-- Column already exists from init; this migration only adds the constraint
-- and the supporting index so Prisma can expose the `cover` relation.

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_coverMediaId_fkey"
  FOREIGN KEY ("coverMediaId")
  REFERENCES "Media"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Event_coverMediaId_idx" ON "Event"("coverMediaId");
