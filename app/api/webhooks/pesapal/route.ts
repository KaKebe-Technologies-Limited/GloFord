import { db } from "@/lib/db";
import { pesapalAdapter, pesapalGetStatus } from "@/lib/services/payments/pesapal";
import { processWebhook } from "../_processWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(req: Request) {
  return processWebhook(req, "PESAPAL", pesapalAdapter, {
    enrich: async (verified) => {
      const trackingId = verified.eventId;
      const donation = await db.donation.findUnique({
        where: { providerRef: trackingId },
        select: { id: true },
      });
      if (!donation) return null;
      const status = await pesapalGetStatus(trackingId);
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
