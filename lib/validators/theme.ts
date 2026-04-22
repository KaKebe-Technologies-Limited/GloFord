import { z } from "zod";

const tokenMap = z.record(z.string().max(200)).optional().default({});

export const themeUpdateSchema = z.object({
  colors: tokenMap,
  typography: tokenMap,
  radius: tokenMap,
  shadows: tokenMap,
});

export type ThemeUpdateInput = z.infer<typeof themeUpdateSchema>;
