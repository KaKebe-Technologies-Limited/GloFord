import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { tags } from "@/lib/cache";

/**
 * Returns the flat token map injected onto <html>. Keys (without
 * the `--token-` prefix) must match the names in app/globals.css.
 *
 * Color values are space-separated RGB triplets (R G B) so they
 * can be used with alpha: rgb(var(--token-primary) / 0.5).
 */
export type ThemeTokens = Record<string, string>;

const DEFAULTS: ThemeTokens = {
  "bg": "255 255 255",
  "surface-2": "248 250 249",
  "fg": "10 10 11",
  "muted": "243 245 244",
  "muted-fg": "100 107 105",
  "card": "255 255 255",
  "card-fg": "10 10 11",
  "hairline": "26 60 52",
  "input": "243 245 244",
  "ring": "26 60 52",
  "primary": "26 60 52",
  "primary-fg": "255 255 255",
  "secondary": "248 250 249",
  "secondary-fg": "10 10 11",
  "accent": "13 122 61",
  "accent-fg": "255 255 255",
  "danger": "239 68 68",
  "danger-fg": "255 255 255",
  "success": "34 197 94",
  "font-sans": '"Inter", ui-sans-serif, system-ui, sans-serif',
  "font-serif": '"Playfair Display", ui-serif, Georgia, serif',
  "radius-sm": "0.25rem",
  "radius-md": "0.5rem",
  "radius-lg": "0.75rem",
};

async function loadActiveTheme(): Promise<ThemeTokens> {
  try {
    const t = await db.theme.findUnique({ where: { id: "singleton" } });
    if (!t) return DEFAULTS;
    const merged: ThemeTokens = { ...DEFAULTS };
    const assign = (obj: unknown, prefix = "") => {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof v === "string") merged[`${prefix}${k}`] = v;
      }
    };
    assign(t.colors);
    assign(t.typography, "font-");
    assign(t.radius, "radius-");
    return merged;
  } catch {
    return DEFAULTS;
  }
}

export const getActiveThemeTokens = unstable_cache(
  loadActiveTheme,
  ["active-theme"],
  { tags: ["theme"], revalidate: 3600 },
);

export { tags };
