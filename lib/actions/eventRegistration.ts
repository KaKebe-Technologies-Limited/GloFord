"use server";

import { revalidatePath } from "next/cache";
import { registerForEvent, cancelRegistration } from "@/lib/services/events/registration";

export async function registerForEventAction(input: {
  eventId: string;
  email: string;
  name?: string;
}) {
  if (!input.eventId || !input.email) {
    throw new Error("Event ID and email are required");
  }
  const reg = await registerForEvent(input);
  revalidatePath(`/events`);
  return { ok: true, status: reg.status };
}

export async function cancelRegistrationAction(input: {
  eventId: string;
  email: string;
}) {
  if (!input.eventId || !input.email) {
    throw new Error("Event ID and email are required");
  }
  await cancelRegistration(input.eventId, input.email);
  revalidatePath(`/events`);
  return { ok: true };
}
