"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
} from "@/lib/services/serviceAreas";

export async function createServiceAreaAction(formData: FormData) {
  await requireActorFromSession();
  await createServiceArea({
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    icon: (formData.get("icon") as string) || "BookOpen",
    color: (formData.get("color") as string) || "from-blue-500 to-blue-600",
    order: Number(formData.get("order") || 0),
  });
  revalidatePath("/admin/service-areas");
}

export async function updateServiceAreaAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await updateServiceArea(id, {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    icon: (formData.get("icon") as string) || "BookOpen",
    color: (formData.get("color") as string) || "from-blue-500 to-blue-600",
    order: Number(formData.get("order") || 0),
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/service-areas");
}

export async function deleteServiceAreaAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  await deleteServiceArea(id);
  revalidatePath("/admin/service-areas");
}

export async function toggleServiceAreaAction(formData: FormData) {
  await requireActorFromSession();
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await updateServiceArea(id, { isActive: !isActive });
  revalidatePath("/admin/service-areas");
}
