import { z } from "zod";
import { cuid, slug } from "./common";
import { blocksSchema } from "@/lib/blocks/types";

export const pageCreateSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  seoTitle: z.string().trim().max(200).optional(),
  seoDesc: z.string().trim().max(400).optional(),
  blocks: blocksSchema.optional().default([]),
});

export const pageUpdateSchema = pageCreateSchema.partial().extend({ id: cuid });

export const pagePublishSchema = z.object({
  id: cuid,
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]),
});

export const pageDeleteSchema = z.object({ id: cuid });

export type PageCreateInput = z.infer<typeof pageCreateSchema>;
export type PageUpdateInput = z.infer<typeof pageUpdateSchema>;
