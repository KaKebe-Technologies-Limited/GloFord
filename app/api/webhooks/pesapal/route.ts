import { runAsSystem } from "@/lib/tenant/context";
import { pesapalAdapter, pesapalGetStatus } from "@/lib/services/payments/pesapal";
import { processWebhook } from "../_processWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Pesapal IPN is a GET with OrderTrackingId. The adapter returns the
 * tracking id as the event; we enrich here by calling
 * GetTransactionStatus to learn the final state.
 */
async function handle(req: Request) {
  return processWebhook(req, "PESAPAL", pesapalAdapter, {
    enrich: async (verified) => {
      const trackingId = verified.eventId;
      const donation = await runAsSystem((tx) =>
        tx.donation.findUnique({
          where: { providerRef: trackingId },
          select: { organizationId: true },
        }),
      );
      if (!donation) return null;
      const status = await pesapalGetStatus(donation.organizationId, trackingId);
      const desc = status.payment_status_description?.toUpperCase();
      if (desc === "COMPLETED") {
        return { providerRef: trackingId, status: "SUCCEEDED", completedAt: new Date() };
      }
      if (desc === "FAILED" || desc === "INVALID" || desc === "REVERSED") {
        return { providerRef: trackingId, status: "FAILED" };
      }
      return null;
    },
  });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
