"use server";

import { updateSubscriberPreferences, type SubscriberPreferences } from "@/lib/services/subscribers/preferences";

export async function updatePreferencesAction(token: string, preferences: SubscriberPreferences) {
  if (!token) throw new Error("Missing token");
  return updateSubscriberPreferences(token, preferences);
}
