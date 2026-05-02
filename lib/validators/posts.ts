import { z } from "zod";
import { cuid, slug } from "./common";
import { blocksSchema } from "@/lib/blocks/types";

export const postCreateSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(400).optional(),
  body: blocksSchema.optional().default([]),
  coverMediaId: z.string().optional().nullable(),
  tagSlugs: z.array(slug).max(12).default([]),
  seoTitle: z.string().trim().max(200).optional().nullable(),
  seoDesc: z.string().trim().max(400).optional().nullable(),
});

export const postUpdateSchema = postCreateSchema.partial().extend({ id: cuid });

export const postStatusSchema = z.object({
  id: cuid,
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]),
});

export const postDeleteSchema = z.object({ id: cuid });
