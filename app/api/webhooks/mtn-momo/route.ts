import { mtnMomoAdapter } from "@/lib/services/payments/mtn-momo";
import { processWebhook } from "../_processWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  return processWebhook(req, "MTN_MOMO", mtnMomoAdapter);
}
