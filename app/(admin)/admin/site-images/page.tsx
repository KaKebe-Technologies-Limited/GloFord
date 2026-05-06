import { requireActorFromSession } from "@/lib/auth-context";
import { listSiteImages } from "@/lib/services/siteImages";
import { SiteImagesClient } from "./SiteImagesClient";

export const metadata = { title: "Site Images" };

export default async function SiteImagesAdminPage() {
  await requireActorFromSession();
  const images = await listSiteImages();
  return <SiteImagesClient images={images} />;
}
