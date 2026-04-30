import { db } from "@/lib/db";
import { revalidateTag, unstable_cache } from "next/cache";

const CACHE_TAG = "faqs";

export const getActiveFaqs = unstable_cache(
  async (category?: string) => {
    return db.faq.findMany({
      where: { isActive: true, ...(category ? { category } : {}) },
      orderBy: { order: "asc" },
    });
  },
  ["faqs-active"],
  { tags: [CACHE_TAG], revalidate: 3600 },
);

export async function getAllFaqs() {
  return db.faq.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });
}

export async function createFaq(data: {
  question: string;
  answer: string;
  category?: string;
  order?: number;
}) {
  const faq = await db.faq.create({ data });
  revalidateTag(CACHE_TAG);
  return faq;
}

export async function updateFaq(
  id: string,
  data: {
    question?: string;
    answer?: string;
    category?: string;
    order?: number;
    isActive?: boolean;
  },
) {
  const faq = await db.faq.update({ where: { id }, data });
  revalidateTag(CACHE_TAG);
  return faq;
}

export async function deleteFaq(id: string) {
  await db.faq.delete({ where: { id } });
  revalidateTag(CACHE_TAG);
}
