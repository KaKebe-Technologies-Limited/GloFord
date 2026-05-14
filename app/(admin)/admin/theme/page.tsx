import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";
import { ThemeEditor } from "./ThemeEditor";

export const metadata = { title: "Theme" };

export default async function ThemePage() {
  await requireActorFromSession();

  const [theme, presets] = await Promise.all([
    db.theme.findUnique({ where: { id: "singleton" } }),
    db.themePreset.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Theme</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Pick a preset for instant preview, or customise individual tokens.
          Saved values are rendered as CSS custom properties globally.
        </p>
      </header>

      <ThemeEditor
        initial={{
          colors: (theme?.colors as Record<string, string>) ?? {},
          typography: (theme?.typography as Record<string, string>) ?? {},
          radius: (theme?.radius as Record<string, string>) ?? {},
          shadows: (theme?.shadows as Record<string, string>) ?? {},
        }}
        presets={presets.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          colors: p.colors as Record<string, string>,
          typography: p.typography as Record<string, string>,
          radius: p.radius as Record<string, string>,
          shadows: p.shadows as Record<string, string>,
          builtIn: p.builtIn,
        }))}
        activePresetId={theme?.presetId ?? null}
      />
    </div>
  );
}
