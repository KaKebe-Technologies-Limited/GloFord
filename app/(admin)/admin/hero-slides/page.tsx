import { requireActorFromSession } from "@/lib/auth-context";
import { getAllHeroSlides } from "@/lib/services/heroSlides";
import { HeroSlidesClient } from "./HeroSlidesClient";

export const metadata = { title: "Hero Slides" };

export default async function HeroSlidesAdminPage() {
  await requireActorFromSession();
  const slides = await getAllHeroSlides();
  return <HeroSlidesClient slides={slides} />;
}
