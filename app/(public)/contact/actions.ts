"use server";

import { createContactMessage } from "@/lib/services/contact";

export async function submitContactAction(formData: FormData) {
  await createContactMessage({
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    subject: formData.get("subject") as string,
    message: formData.get("message") as string,
  });
}
