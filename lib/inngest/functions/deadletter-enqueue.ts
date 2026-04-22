import { inngest } from "../client";
import { runAsSystem } from "@/lib/tenant/context";

/**
 * Persist a failed external event for later manual retry from the
 * admin dead-letter UI. Inngest's own retries usually absorb transient
 * failures — this is for the terminal ones.
 *
 * Uses runAsSystem because dead letters can originate from any tenant
 * (or none), and the DeadLetter table's nullable-tenant policy allows
 * writes when role=SYSTEM.
 */
export const deadletterEnqueue = inngest.createFunction(
  { id: "deadletter-enqueue", retries: 2 },
  { event: "deadletter/enqueue" },
  async ({ event }) => {
    const { orgId, source, eventType, payload, error } = event.data;
    await runAsSystem((tx) =>
      tx.deadLetter.create({
        data: {
          organizationId: orgId ?? null,
          source,
          eventType,
          payload: payload as never,
          error,
        },
      }),
    );
  },
);
