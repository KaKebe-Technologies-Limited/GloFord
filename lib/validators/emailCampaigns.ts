import { z } from "zod";
import { cuid } from "./common";
import { blocksSchema } from "@/lib/blocks/types";

export const emailCampaignCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(400).optional(),
  trigger: z.enum(["ON_SIGNUP", "ON_DONATION", "SCHEDULED", "MANUAL"]),
  triggerConfig: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(false),
  segmentIds: z.array(cuid).default([]),
});

export const emailCampaignUpdateSchema = emailCampaignCreateSchema
  .partial()
  .extend({ id: cuid });

export const emailCampaignDeleteSchema = z.object({ id: cuid });

export const emailCampaignActivateSchema = z.object({
  id: cuid,
  isActive: z.boolean(),
});

export const campaignEmailCreateSchema = z.object({
  campaignId: cuid,
  stepOrder: z.number().int().min(0),
  subject: z.string().trim().min(1).max(200),
  preheader: z.string().trim().max(160).optional(),
  content: blocksSchema.optional().default([]),
  delayMinutes: z.number().int().min(0).default(0),
});

export const campaignEmailUpdateSchema = campaignEmailCreateSchema
  .partial()
  .extend({ id: cuid });

export const campaignEmailDeleteSchema = z.object({ id: cuid });
