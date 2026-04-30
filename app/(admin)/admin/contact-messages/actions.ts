"use server";

import { revalidatePath } from "next/cache";
import { markMessageRead, deleteContactMessage } from "@/lib/services/contact";

export async function markReadAction(formData: FormData) {
  await markMessageRead(formData.get("id") as string);
  revalidatePath("/admin/contact-messages");
}

export async function deleteMessageAction(formData: FormData) {
  await deleteContactMessage(formData.get("id") as string);
  revalidatePath("/admin/contact-messages");
}
