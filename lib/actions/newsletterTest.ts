"use server";

import { requireActorFromSession } from "@/lib/auth-context";
import { sendNewsletterTest } from "@/lib/services/newsletters/sendTest";

export async function sendTestEmailAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const input = raw as { newsletterId: string; recipientEmail: string };
  if (!input.newsletterId || !input.recipientEmail) {
    throw new Error("Newsletter ID and recipient email are required");
  }
  return sendNewsletterTest(actor, input);
}
