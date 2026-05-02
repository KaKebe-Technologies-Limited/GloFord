"use server";

import { headers } from "next/headers";
import { createContactMessage } from "@/lib/services/contact";
import { rateLimit } from "@/lib/ratelimit";
import { ValidationError } from "@/lib/errors";

export async function submitContactAction(formData: FormData) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const rl = await rateLimit({
    bucket: "contact-submit",
    identifier: ip,
    limit: 5,
    windowSeconds: 3600,
  });
  if (!rl.ok) {
    throw new ValidationError("Too many messages — please try again later.");
  }

  await createContactMessage({
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    subject: formData.get("subject") as string,
    message: formData.get("message") as string,
  });
}
