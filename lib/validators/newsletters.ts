import { z } from "zod";
import { cuid } from "./common";
import { blocksSchema } from "@/lib/blocks/types";

export const newsletterCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(200),
  preheader: z.string().trim().max(160).optional(),
  content: blocksSchema.optional().default([]),
  segmentIds: z.array(cuid).default([]),
});

export const newsletterUpdateSchema = newsletterCreateSchema.partial().extend({ id: cuid });

export const newsletterScheduleSchema = z.object({
  id: cuid,
  scheduledAt: z.coerce.date().nullable(),
});

export const newsletterSendNowSchema = z.object({ id: cuid });
export const newsletterDeleteSchema = z.object({ id: cuid });
