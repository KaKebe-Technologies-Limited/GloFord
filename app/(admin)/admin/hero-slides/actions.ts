"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
} from "@/lib/services/heroSlides";
import {
  parseFormData,
  createHeroSlideSchema,
  updateHeroSlideSchema,
  toggleSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function createHeroSlideAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createHeroSlideSchema, formData);
  await createHeroSlide({
    title: data.title,
    subtitle: data.subtitle ?? undefined,
    ctaLabel: data.ctaLabel ?? undefined,
    ctaHref: data.ctaHref ?? undefined,
    imageUrl: data.imageUrl,
    imageAlt: data.imageAlt ?? undefined,
    durationMs: data.durationSeconds * 1000,
    order: data.order,
  });
  revalidatePath("/admin/hero-slides");
}

export async function updateHeroSlideAction(formData: FormData) {
  await requireActorFromSession();
  const { id, durationSeconds, ...rest } = parseFormData(updateHeroSlideSchema, formData);
  await updateHeroSlide(id, {
    ...rest,
    durationMs: durationSeconds * 1000,
  });
  revalidatePath("/admin/hero-slides");
}

export async function deleteHeroSlideAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteHeroSlide(id);
  revalidatePath("/admin/hero-slides");
}

export async function toggleHeroSlideAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  await updateHeroSlide(id, { isActive: !isActive });
  revalidatePath("/admin/hero-slides");
}
