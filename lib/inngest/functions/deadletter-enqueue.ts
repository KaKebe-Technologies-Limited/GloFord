import { inngest } from "../client";
import { db } from "@/lib/db";

/**
 * Persist a failed external event for later manual retry from the
 * admin dead-letter UI. Inngest's own retries usually absorb transient
 * failures — this is for the terminal ones.
 */
export const deadletterEnqueue = inngest.createFunction(
  { id: "deadletter-enqueue", retries: 2 },
  { event: "deadletter/enqueue" },
  async ({ event }) => {
    const { orgId, source, eventType, payload, error } = event.data;
    await db.deadLetter.create({
      data: {
        organizationId: orgId ?? null,
        source,
        eventType,
        payload: payload as never,
        error,
      },
    });
  },
);
