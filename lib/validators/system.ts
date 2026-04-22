import { z } from "zod";
import { cuid } from "./common";

export const deadLetterRetrySchema = z.object({ id: cuid });
export const deadLetterResolveSchema = z.object({
  id: cuid,
  status: z.enum(["RESOLVED", "IGNORED"]),
});

export const versionRestoreSchema = z.object({ id: cuid });

export const featureFlagUpsertSchema = z.object({
  key: z.string().trim().min(1).max(80).regex(/^[a-z0-9._-]+$/i, "Invalid key"),
  description: z.string().trim().max(400).optional(),
  isEnabled: z.boolean(),
  rules: z.record(z.unknown()).nullable().optional(),
});

export const featureFlagDeleteSchema = z.object({ id: cuid });
