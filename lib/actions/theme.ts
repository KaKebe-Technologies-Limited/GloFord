"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { updateTheme } from "@/lib/services/theme";

export async function updateThemeAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updateTheme(actor, raw);
  revalidatePath("/admin/theme");
  revalidatePath("/", "layout");
}
