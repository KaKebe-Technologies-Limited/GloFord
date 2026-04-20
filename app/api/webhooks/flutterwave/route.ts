import { db } from "@/lib/db";
import { flutterwaveAdapter, flutterwaveVerifyByRef } from "@/lib/services/payments/flutterwave";
import { processWebhook } from "../_processWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Flutterwave webhook: after signature hash check, verify the charge
 * amount + currency against our DB via transactions/verify_by_reference.
 * Never trust the status field in the webhook payload alone.
 */
export async function POST(req: Request) {
  return processWebhook(req, "FLUTTERWAVE", flutterwaveAdapter, {
    enrich: async (verified) => {
      const event = verified.event as { data?: { tx_ref?: string } };
      const txRef = event.data?.tx_ref ?? verified.eventId;
      if (!txRef) return null;

      const donation = await db.donation.findUnique({
        where: { providerRef: txRef },
        select: { organizationId: true, amountCents: true, currency: true },
      });
      if (!donation) return null;

      const verify = await flutterwaveVerifyByRef(donation.organizationId, txRef);
      const status = verify.data?.status?.toLowerCase();
      const amount = verify.data?.amount ?? 0;
      const currency = verify.data?.currency?.toUpperCase();

      if (status !== "successful") {
        return { providerRef: txRef, status: "FAILED" };
      }
      if (Math.round(amount * 100) !== donation.amountCents || currency !== donation.currency) {
        // Amount/currency mismatch = fraud or misconfiguration; log and fail.
        return { providerRef: txRef, status: "FAILED" };
      }
      return { providerRef: txRef, status: "SUCCEEDED", completedAt: new Date() };
    },
  });
}
