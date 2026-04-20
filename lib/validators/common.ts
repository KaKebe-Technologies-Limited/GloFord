import { z } from "zod";

export const cuid = z.string().regex(/^[a-z0-9]{20,40}$/i, "Invalid id");

export const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, digits, or hyphens");

export const email = z.string().email().max(320);

export const nonEmpty = (label = "Value") => z.string().trim().min(1, `${label} is required`).max(500);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
