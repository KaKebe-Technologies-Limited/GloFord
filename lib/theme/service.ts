import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { tags } from "@/lib/cache";

/**
 * Returns the flat token map injected onto <html>. Keys (without
 * the `--token-` prefix) must match the names in app/globals.css.
 *
 * For launch the platform is single-tenant, so we resolve the only
 * active organization's Theme. When routing becomes per-org (Phase 2+),
 * swap this for a host/subdomain lookup.
 */
export type ThemeTokens = Record<string, string>;

const DEFAULTS: ThemeTokens = {
  "bg": "0 0% 100%",
  "fg": "224 71% 4%",
  "muted": "220 14% 96%",
  "muted-fg": "220 9% 46%",
  "card": "0 0% 100%",
  "card-fg": "224 71% 4%",
  "border": "220 13% 91%",
  "input": "220 13% 91%",
  "ring": "215 20% 65%",
  "primary": "212 92% 38%",
  "primary-fg": "0 0% 100%",
  "secondary": "220 14% 96%",
  "secondary-fg": "224 71% 4%",
  "accent": "35 92% 52%",
  "accent-fg": "224 71% 4%",
  "danger": "0 84% 60%",
  "danger-fg": "0 0% 100%",
  "success": "142 71% 45%",
  "font-sans": '"Inter", ui-sans-serif, system-ui, sans-serif',
  "font-serif": "ui-serif, Georgia, serif",
  "radius-sm": "0.25rem",
  "radius-md": "0.5rem",
  "radius-lg": "0.75rem",
};

async function loadActiveTheme(): Promise<ThemeTokens> {
  try {
    const org = await db.organization.findFirst({
      where: { isActive: true },
      select: { id: true, theme: true },
      orderBy: { createdAt: "asc" },
    });

    if (!org?.theme) return DEFAULTS;
    const t = org.theme;
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
    // DB unreachable (e.g. before first migration). Fall back to defaults
    // so the site still renders. Theme edits via admin will propagate
    // once the database is available.
    return DEFAULTS;
  }
}

export const getActiveThemeTokens = unstable_cache(
  loadActiveTheme,
  ["active-theme"],
  { tags: ["theme"], revalidate: 3600 },
);

export { tags };
