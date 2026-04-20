import { z } from "zod";
import { cuid } from "./common";

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];

export const mediaPresignSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mime: z.string().refine((m) => ALLOWED_MIME.includes(m), "Unsupported file type"),
  size: z.number().int().positive().max(25 * 1024 * 1024, "File is larger than 25 MB"),
});

export const mediaFinalizeSchema = z.object({
  key: z.string().min(1),
  mime: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().max(300).optional(),
});

export const mediaDeleteSchema = z.object({ id: cuid });
