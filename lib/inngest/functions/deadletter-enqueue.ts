import { inngest } from "../client";
import { db } from "@/lib/db";

export const deadletterEnqueue = inngest.createFunction(
  { id: "deadletter-enqueue", retries: 2 },
  { event: "deadletter/enqueue" },
  async ({ event }) => {
    const { source, eventType, payload, error } = event.data;
    await db.deadLetter.create({
      data: {
        source,
        eventType,
        payload: payload as never,
        error,
      },
    });
  },
);
