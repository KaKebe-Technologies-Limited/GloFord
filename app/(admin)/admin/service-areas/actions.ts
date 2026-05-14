"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import {
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
} from "@/lib/services/serviceAreas";
import {
  parseFormData,
  createServiceAreaSchema,
  updateServiceAreaSchema,
  toggleSchema,
  deleteSchema,
} from "@/lib/validators/admin";

export async function createServiceAreaAction(formData: FormData) {
  await requireActorFromSession();
  const data = parseFormData(createServiceAreaSchema, formData);
  await createServiceArea(data);
  revalidatePath("/admin/service-areas");
}

export async function updateServiceAreaAction(formData: FormData) {
  await requireActorFromSession();
  const { id, ...rest } = parseFormData(updateServiceAreaSchema, formData);
  await updateServiceArea(id, rest);
  revalidatePath("/admin/service-areas");
}

export async function deleteServiceAreaAction(formData: FormData) {
  await requireActorFromSession();
  const { id } = parseFormData(deleteSchema, formData);
  await deleteServiceArea(id);
  revalidatePath("/admin/service-areas");
}

export async function toggleServiceAreaAction(formData: FormData) {
  await requireActorFromSession();
  const { id, isActive } = parseFormData(toggleSchema, formData);
  await updateServiceArea(id, { isActive: !isActive });
  revalidatePath("/admin/service-areas");
}
