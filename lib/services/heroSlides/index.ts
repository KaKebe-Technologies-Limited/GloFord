import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";

const CACHE_TAG = "hero-slides";

export const getActiveHeroSlides = unstable_cache(
  async () => {
    return db.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  },
  ["hero-slides-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getAllHeroSlides() {
  return db.heroSlide.findMany({ orderBy: { order: "asc" } });
}

export async function getHeroSlide(id: string) {
  return db.heroSlide.findUniqueOrThrow({ where: { id } });
}

export async function createHeroSlide(data: {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl: string;
  imageAlt?: string;
  durationMs?: number;
  order?: number;
}) {
  const slide = await db.heroSlide.create({ data });
  revalidateTag(CACHE_TAG);
  return slide;
}

export async function updateHeroSlide(
  id: string,
  data: {
    title?: string;
    subtitle?: string | null;
    ctaLabel?: string | null;
    ctaHref?: string | null;
    imageUrl?: string;
    imageAlt?: string | null;
    durationMs?: number;
    order?: number;
    isActive?: boolean;
  },
) {
  const slide = await db.heroSlide.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  return slide;
}

export async function deleteHeroSlide(id: string) {
  await db.heroSlide.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}
