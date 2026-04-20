import { airtelMoneyAdapter } from "@/lib/services/payments/airtel-money";
import { processWebhook } from "../_processWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  return processWebhook(req, "AIRTEL_MONEY", airtelMoneyAdapter);
}
