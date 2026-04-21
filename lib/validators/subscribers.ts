import { z } from "zod";
import { cuid, email } from "./common";

export const subscribeSchema = z.object({
  email,
  name: z.string().trim().max(200).optional(),
  source: z.string().trim().max(60).optional(),
});

export const subscriberUpdateSchema = z.object({
  id: cuid,
  name: z.string().trim().max(200).optional().nullable(),
  status: z.enum(["PENDING", "ACTIVE", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED"]).optional(),
});

export const subscriberDeleteSchema = z.object({ id: cuid });

export const subscriberAssignSegmentsSchema = z.object({
  id: cuid,
  segmentIds: z.array(cuid),
});
