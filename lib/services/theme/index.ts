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
    const row = await tx.theme.upsert({
      where: { id: SINGLETON },
      create: {
        id: SINGLETON,
        colors: input.colors as never,
        typography: input.typography as never,
        radius: input.radius as never,
        shadows: input.shadows as never,
      },
      update: {
        colors: input.colors as never,
        typography: input.typography as never,
        radius: input.radius as never,
        shadows: input.shadows as never,
      },
    });
    try {
      revalidateTag(tags.theme());
    } catch {
      /* revalidateTag isn't always available in test contexts */
    }
    return row;
  },
  version: (out) => ({ entityType: "Theme", entityId: out.id }),
});
