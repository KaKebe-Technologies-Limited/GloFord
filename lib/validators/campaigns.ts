import { z } from "zod";
import { cuid, slug } from "./common";

export const campaignCreateSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  goalCents: z.number().int().positive().optional().nullable(),
  currency: z.string().length(3).default("USD"),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  programId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const campaignUpdateSchema = campaignCreateSchema.partial().extend({ id: cuid });
export const campaignDeleteSchema = z.object({ id: cuid });
export const campaignToggleSchema = z.object({ id: cuid, isActive: z.boolean() });
