import { createService } from "@/lib/services/_shared";
import { themeUpdateSchema } from "@/lib/validators/theme";
import { revalidateTag } from "next/cache";
import { tags } from "@/lib/cache";

export const updateTheme = createService({
  module: "theme",
  action: "update",
  schema: themeUpdateSchema,
  permission: () => ({ type: "Theme" }),
  loadBefore: async ({ actor, tx }) =>
    tx.theme.findUnique({ where: { organizationId: actor.orgId } }),
  exec: async ({ input, actor, tx }) => {
    const row = await tx.theme.upsert({
      where: { organizationId: actor.orgId },
      create: {
        organizationId: actor.orgId,
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
    // Theme tokens are cached globally; bust so the next render picks
    // up the new custom properties.
    try {
      revalidateTag(tags.theme(actor.orgId));
    } catch {
      /* revalidateTag isn't always available in test contexts */
    }
    return row;
  },
  version: (out) => ({ entityType: "Theme", entityId: out.id }),
});
