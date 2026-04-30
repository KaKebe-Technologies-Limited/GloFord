import { requireActorFromSession } from "@/lib/auth-context";
import { getSiteSettings } from "@/lib/services/settings/site";
import { SiteSettingsForm } from "./SiteSettingsForm";

export const metadata = { title: "Site settings" };

type Obj = Record<string, string | undefined>;

export default async function SiteSettingsPage() {
  await requireActorFromSession();
  const s = await getSiteSettings();
  const contact = (s?.contact as Obj) ?? {};
  const socials = (s?.socials as Obj) ?? {};
  const seo = (s?.seo as Obj) ?? {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Site settings</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Brand, contact, social links, and SEO defaults.
        </p>
      </header>

      <SiteSettingsForm
        initial={{
          siteName: s?.siteName ?? "Platform",
          logoUrl: s?.logoUrl ?? "",
          loginBgUrl: s?.loginBgUrl ?? "",
          donationsEnabled: s?.donationsEnabled ?? true,
          campaignsEnabled: s?.campaignsEnabled ?? true,
          contact: {
            email: contact.email ?? "",
            phone: contact.phone ?? "",
            address: contact.address ?? "",
          },
          socials: {
            twitter: socials.twitter ?? "",
            facebook: socials.facebook ?? "",
            instagram: socials.instagram ?? "",
            linkedin: socials.linkedin ?? "",
            youtube: socials.youtube ?? "",
          },
          seo: {
            defaultTitle: seo.defaultTitle ?? "",
            defaultDescription: seo.defaultDescription ?? "",
            ogImageUrl: seo.ogImageUrl ?? "",
          },
        }}
      />
    </div>
  );
}
