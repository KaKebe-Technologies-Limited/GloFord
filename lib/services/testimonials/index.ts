import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";

const CACHE_TAG = "testimonials";

export const getActiveTestimonials = unstable_cache(
  async () => {
    return db.testimonial.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  },
  ["testimonials-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getAllTestimonials() {
  return db.testimonial.findMany({ orderBy: { order: "asc" } });
}

export async function createTestimonial(data: {
  quote: string;
  authorName: string;
  authorRole?: string;
  authorOrg?: string;
  avatarUrl?: string;
  rating?: number;
  order?: number;
}) {
  const t = await db.testimonial.create({ data });
  revalidateTag(CACHE_TAG);
  return t;
}

export async function updateTestimonial(
  id: string,
  data: {
    quote?: string;
    authorName?: string;
    authorRole?: string | null;
    authorOrg?: string | null;
    avatarUrl?: string | null;
    rating?: number | null;
    order?: number;
    isActive?: boolean;
  },
) {
  const t = await db.testimonial.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  return t;
}

export async function deleteTestimonial(id: string) {
  await db.testimonial.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}
