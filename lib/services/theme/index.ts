import { createService } from "@/lib/services/_shared";
import { themeUpdateSchema } from "@/lib/validators/theme";
import { revalidateTag } from "next/cache";
import { tags } from "@/lib/cache";

const SINGLETON = "singleton";

export const updateTheme = createService({
  module: "theme",
  action: "update",
  schema: themeUpdateSchema,
  permission: () => ({ type: "Theme" }),
  loadBefore: async ({ tx }) => tx.theme.findUnique({ where: { id: SINGLETON } }),
  exec: async ({ input, tx }) => {
    if (input.presetId) {
      const preset = await tx.themePreset.findUnique({ where: { id: input.presetId } });
      if (!preset) throw new Error(`Theme preset "${input.presetId}" not found`);
    }
    const row = await tx.theme.upsert({
      where: { id: SINGLETON },
      create: {
        id: SINGLETON,
        colors: input.colors as never,
        typography: input.typography as never,
        radius: input.radius as never,
        presetId: input.presetId ?? null,
      },
      update: {
        colors: input.colors as never,
        typography: input.typography as never,
        radius: input.radius as never,
        presetId: input.presetId ?? null,
      },
    });
    revalidateTag(tags.theme());
    return row;
  },
  version: (out) => ({ entityType: "Theme", entityId: out.id }),
});
