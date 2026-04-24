import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";
import { ThemeEditor } from "./ThemeEditor";

export const metadata = { title: "Theme" };

export default async function ThemePage() {
  await requireActorFromSession();
  const theme = await db.theme.findUnique({ where: { id: "singleton" } });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Theme</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Color tokens, typography, radii, and shadows. Saved values are
          rendered as CSS custom properties at the document root.
        </p>
      </header>

      <ThemeEditor
        initial={{
          colors: (theme?.colors as Record<string, string>) ?? {},
          typography: (theme?.typography as Record<string, string>) ?? {},
          radius: (theme?.radius as Record<string, string>) ?? {},
          shadows: (theme?.shadows as Record<string, string>) ?? {},
        }}
      />
    </div>
  );
}
