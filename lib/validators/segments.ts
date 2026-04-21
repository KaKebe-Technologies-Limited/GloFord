import { z } from "zod";
import { cuid, slug } from "./common";

export const segmentCreateSchema = z.object({
  slug,
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).optional(),
});

export const segmentUpdateSchema = segmentCreateSchema.partial().extend({ id: cuid });

export const segmentDeleteSchema = z.object({ id: cuid });
