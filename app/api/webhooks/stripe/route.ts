import { stripeAdapter } from "@/lib/services/payments/stripe";
import { processWebhook } from "../_processWebhook";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return processWebhook(req, "STRIPE", stripeAdapter);
}
