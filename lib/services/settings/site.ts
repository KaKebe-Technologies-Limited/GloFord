import { createService } from "@/lib/services/_shared";
import { siteSettingsUpdateSchema } from "@/lib/validators/settings";
import { runAsTenant } from "@/lib/tenant/context";

export const updateSiteSettings = createService({
  module: "settings",
  action: "update",
  schema: siteSettingsUpdateSchema,
  permission: () => ({ type: "SiteSettings" }),
  loadBefore: async ({ actor, tx }) =>
    tx.siteSettings.findUnique({ where: { organizationId: actor.orgId } }),
  exec: async ({ input, actor, tx }) =>
    tx.siteSettings.upsert({
      where: { organizationId: actor.orgId },
      create: {
        organizationId: actor.orgId,
        siteName: input.siteName,
        logoUrl: input.logoUrl ?? null,
        contact: input.contact as never,
        socials: input.socials as never,
        seo: input.seo as never,
      },
      update: {
        siteName: input.siteName,
        logoUrl: input.logoUrl ?? null,
        contact: input.contact as never,
        socials: input.socials as never,
        seo: input.seo as never,
      },
    }),
  version: (out) => ({ entityType: "SiteSettings", entityId: out.id }),
});

export function getSiteSettings(orgId: string) {
  return runAsTenant(orgId, (tx) =>
    tx.siteSettings.findUnique({ where: { organizationId: orgId } }),
  );
}
