import { z } from "zod";
import { cuid } from "./common";

export const navCreateSchema = z.object({
  location: z.enum(["HEADER", "FOOTER", "ADMIN_SIDEBAR"]),
  parentId: cuid.nullable().optional(),
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().max(400).nullable().optional(),
  pageId: cuid.nullable().optional(),
  order: z.number().int().min(0).default(0),
  requiredPermission: z.string().trim().max(120).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const navUpdateSchema = navCreateSchema.partial().extend({ id: cuid });

export const navDeleteSchema = z.object({ id: cuid });

export const navReorderSchema = z.object({
  items: z.array(z.object({ id: cuid, order: z.number().int().min(0) })).min(1),
});
