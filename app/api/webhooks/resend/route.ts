import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const sigHeader = req.headers.get("svix-signature");
  const svixId = req.headers.get("svix-id");
  const svixTs = req.headers.get("svix-timestamp");

  if (secret && sigHeader && svixId && svixTs) {
    const signedPayload = `${svixId}.${svixTs}.${raw}`;
    const keyBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const expected = createHmac("sha256", keyBytes).update(signedPayload).digest("base64");
    const provided = sigHeader
      .split(" ")
      .map((p) => p.split(",")[1])
      .filter((p): p is string => typeof p === "string" && p.length > 0);
    const ok = provided.some((p) => {
      const a = Buffer.from(p);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    });
    if (!ok) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    type?: string;
    data?: { email_id?: string; tags?: { name: string; value: string }[] };
  };
  const providerMsgId = event.data?.email_id;
  const type = event.type;
  if (!providerMsgId || !type) return NextResponse.json({ received: true });

  const update: Record<string, unknown> = {};
  const now = new Date();
  switch (type) {
    case "email.delivered":
      update.status = "DELIVERED";
      break;
    case "email.opened":
      update.status = "OPENED";
      update.openedAt = now;
      break;
    case "email.clicked":
      update.status = "CLICKED";
      update.clickedAt = now;
      break;
    case "email.bounced":
      update.status = "BOUNCED";
      update.bouncedAt = now;
      break;
    case "email.complained":
    case "email.delivery_delayed":
    case "email.failed":
      update.status = "FAILED";
      update.error = type;
      break;
    default:
      return NextResponse.json({ received: true, ignored: type });
  }

  await db.newsletterLog.updateMany({
    where: { providerMsgId },
    data: update,
  });

  if (type === "email.bounced" || type === "email.complained") {
    const subscriberId = event.data?.tags?.find((t) => t.name === "subscriberId")?.value;
    if (subscriberId) {
      await db.subscriber.update({
        where: { id: subscriberId },
        data: { status: type === "email.bounced" ? "BOUNCED" : "COMPLAINED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
