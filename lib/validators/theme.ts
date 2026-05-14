import { z } from "zod";

/** Validates an RGB triplet like "26 60 52" — three integers 0-255 separated by spaces */
const rgbTriplet = z.string().refine(
  (v) => {
    const parts = v.trim().split(/\s+/);
    if (parts.length !== 3) return false;
    return parts.every((p) => {
      const n = Number(p);
      return Number.isInteger(n) && n >= 0 && n <= 255;
    });
  },
  { message: "Color must be an RGB triplet (e.g. '26 60 52')" },
);

const colorTokenMap = z
  .record(
    z.string().regex(/^[a-z][a-z0-9-]*$/, "Invalid token key"),
    rgbTriplet,
  )
  .optional()
  .default({});

const typographyTokenMap = z
  .record(
    z.string().regex(/^[a-z][a-z0-9-]*$/, "Invalid token key"),
    z.string().min(1, "Font value cannot be empty").max(500),
  )
  .optional()
  .default({});

const radiusTokenMap = z
  .record(
    z.string().regex(/^[a-z][a-z0-9-]*$/, "Invalid token key"),
    z
      .string()
      .min(1)
      .max(50)
      .regex(/^[\d.]+(rem|px|em|%)$/, "Radius must include a CSS unit (e.g. '0.5rem')"),
  )
  .optional()
  .default({});

export const themeUpdateSchema = z.object({
  colors: colorTokenMap,
  typography: typographyTokenMap,
  radius: radiusTokenMap,
  presetId: z.string().nullable().default(null),
});

export type ThemeUpdateInput = z.infer<typeof themeUpdateSchema>;
