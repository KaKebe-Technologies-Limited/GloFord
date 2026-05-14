"use server";

import { revalidatePath } from "next/cache";
import { markMessageRead, deleteContactMessage } from "@/lib/services/contact";
import { parseFormData, messageIdSchema } from "@/lib/validators/admin";

export async function markReadAction(formData: FormData) {
  const { id } = parseFormData(messageIdSchema, formData);
  await markMessageRead(id);
  revalidatePath("/admin/contact-messages");
}

export async function deleteMessageAction(formData: FormData) {
  const { id } = parseFormData(messageIdSchema, formData);
  await deleteContactMessage(id);
  revalidatePath("/admin/contact-messages");
}
