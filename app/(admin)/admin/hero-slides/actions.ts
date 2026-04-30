"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
} from "@/lib/services/heroSlides";

export async function createHeroSlideAction(formData: FormData) {
  await requireActorFromSession();
  await createHeroSlide({
    title: formData.get("title") as string,
    subtitle: (formData.get("subtitle") as string) || undefined,
    ctaLabel: (formData.get("ctaLabel") as string) || undefined,
    ctaHref: (formData.get("ctaHref") as string) || undefined,
    imageUrl: formData.get("imageUrl") as string,
    imageAlt: (formData.get("imageAlt") as string) || undefined,
    durationMs: Number(formData.get("durationSeconds") || 5) * 1000,
    order: Number(formData.get("order") || 0),
  });
  revalidatePath("/admin/hero-slides");
}

export async function updateHeroSlideAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await updateHeroSlide(id, {
    title: formData.get("title") as string,
    subtitle: (formData.get("subtitle") as string) || null,
    ctaLabel: (formData.get("ctaLabel") as string) || null,
    ctaHref: (formData.get("ctaHref") as string) || null,
    imageUrl: formData.get("imageUrl") as string,
    imageAlt: (formData.get("imageAlt") as string) || null,
    durationMs: Number(formData.get("durationSeconds") || 5) * 1000,
    order: Number(formData.get("order") || 0),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/hero-slides");
}

export async function deleteHeroSlideAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await deleteHeroSlide(id);
  revalidatePath("/admin/hero-slides");
}

export async function toggleHeroSlideAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateHeroSlide(id, { isActive: !isActive });
  revalidatePath("/admin/hero-slides");
}
