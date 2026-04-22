import { z } from "zod";
import { cuid, slug } from "./common";
import { blocksSchema } from "@/lib/blocks/types";

export const eventCreateSchema = z
  .object({
    slug,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(2000),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().nullable().optional(),
    location: z.string().trim().max(200).nullable().optional(),
    coverMediaId: cuid.nullable().optional(),
    isPublic: z.boolean().default(true),
    segmentIds: z.array(cuid).default([]),
  })
  .refine(
    (v) => !v.endsAt || v.endsAt >= v.startsAt,
    { message: "End time must be after start time", path: ["endsAt"] },
  );

export const eventUpdateSchema = z.object({
  id: cuid,
  slug: slug.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  coverMediaId: cuid.nullable().optional(),
  isPublic: z.boolean().optional(),
  segmentIds: z.array(cuid).optional(),
});

export const eventDeleteSchema = z.object({ id: cuid });

export const eventNotificationCreateSchema = z.object({
  eventId: cuid,
  type: z.enum(["ANNOUNCEMENT", "REMINDER"]),
  subject: z.string().trim().min(1).max(200),
  content: blocksSchema.optional().default([]),
  sendAt: z.coerce.date(),
});

export const eventNotificationUpdateSchema = eventNotificationCreateSchema
  .partial()
  .extend({ id: cuid });

export const eventNotificationDeleteSchema = z.object({ id: cuid });

export const eventNotificationSendNowSchema = z.object({ id: cuid });
