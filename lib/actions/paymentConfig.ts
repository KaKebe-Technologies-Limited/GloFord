"use server";

import { revalidatePath } from "next/cache";
import { requireActorFromSession } from "@/lib/auth-context";
import { savePaymentConfig, togglePaymentProvider } from "@/lib/services/settings/paymentConfig";

export async function savePaymentConfigAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await savePaymentConfig(actor, raw);
  revalidatePath("/admin/settings/payments");
}

export async function togglePaymentProviderAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await togglePaymentProvider(actor, raw);
  revalidatePath("/admin/settings/payments");
}
