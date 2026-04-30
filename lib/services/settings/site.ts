import { createService } from "@/lib/services/_shared";
import { siteSettingsUpdateSchema } from "@/lib/validators/settings";
import { db } from "@/lib/db";

const SINGLETON = "singleton";

export const updateSiteSettings = createService({
  module: "settings",
  action: "update",
  schema: siteSettingsUpdateSchema,
  permission: () => ({ type: "SiteSettings" }),
  loadBefore: async ({ tx }) =>
    tx.siteSettings.findUnique({ where: { id: SINGLETON } }),
  exec: async ({ input, tx }) =>
    tx.siteSettings.upsert({
      where: { id: SINGLETON },
      create: {
        id: SINGLETON,
        siteName: input.siteName,
        logoUrl: input.logoUrl ?? null,
        loginBgUrl: input.loginBgUrl ?? null,
        contact: input.contact as never,
        socials: input.socials as never,
        seo: input.seo as never,
        donationsEnabled: input.donationsEnabled,
        campaignsEnabled: input.campaignsEnabled,
      },
      update: {
        siteName: input.siteName,
        logoUrl: input.logoUrl ?? null,
        loginBgUrl: input.loginBgUrl ?? null,
        contact: input.contact as never,
        socials: input.socials as never,
        seo: input.seo as never,
        donationsEnabled: input.donationsEnabled,
        campaignsEnabled: input.campaignsEnabled,
      },
    }),
  version: (out) => ({ entityType: "SiteSettings", entityId: out.id }),
});

export function getSiteSettings() {
  return db.siteSettings.findUnique({ where: { id: SINGLETON } });
}
