import { UAParser } from "ua-parser-js";
import { inngest } from "../client";
import { db } from "@/lib/db";

export const auditLog = inngest.createFunction(
  { id: "audit-log", retries: 3 },
  { event: "audit/log" },
  async ({ event }) => {
    const { actor, action, module, entityType, entityId, diff, correlationId, request } = event.data;

    let deviceType: string | undefined;
    let os: string | undefined;
    let browser: string | undefined;
    if (request?.userAgent) {
      const parsed = new UAParser(request.userAgent).getResult();
      deviceType = parsed.device.type ?? "desktop";
      os = parsed.os.name;
      browser = parsed.browser.name;
    }

    await db.auditLog.create({
      data: {
        userId: actor?.userId ?? null,
        userRole: actor?.role ?? null,
        action,
        module,
        entityType,
        entityId,
        diff: diff as never,
        ipAddress: request?.ip,
        userAgent: request?.userAgent,
        deviceType,
        os,
        browser,
        correlationId,
      },
    });
  },
);
