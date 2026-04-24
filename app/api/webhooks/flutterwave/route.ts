import { db } from "@/lib/db";
import { flutterwaveAdapter, flutterwaveVerifyByRef } from "@/lib/services/payments/flutterwave";
import { processWebhook } from "../_processWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  return processWebhook(req, "FLUTTERWAVE", flutterwaveAdapter, {
    enrich: async (verified) => {
      const event = verified.event as { data?: { tx_ref?: string } };
      const txRef = event.data?.tx_ref ?? verified.eventId;
      if (!txRef) return null;

      const donation = await db.donation.findUnique({
        where: { providerRef: txRef },
        select: { amountCents: true, currency: true },
      });
      if (!donation) return null;

      const verify = await flutterwaveVerifyByRef(txRef);
      const status = verify.data?.status?.toLowerCase();
      const amount = verify.data?.amount ?? 0;
      const currency = verify.data?.currency?.toUpperCase();

      if (status !== "successful") {
        return { providerRef: txRef, status: "FAILED" };
      }
      if (Math.round(amount * 100) !== donation.amountCents || currency !== donation.currency) {
        return { providerRef: txRef, status: "FAILED" };
      }
      return { providerRef: txRef, status: "SUCCEEDED", completedAt: new Date() };
    },
  });
}
