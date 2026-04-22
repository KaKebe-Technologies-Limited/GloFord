import { UAParser } from "ua-parser-js";
import { inngest } from "../client";
import { runAsSystem } from "@/lib/tenant/context";

/**
 * Async audit writer.
 *
 * Everything about audit is best-effort:
 *   • The request that triggered it has already returned.
 *   • UA parsing + (future) geo lookup enrich here, not inline.
 *   • If this function fails, Inngest retries; if it exhausts retries,
 *     the audit row is lost but the originating action still succeeded.
 *     Audit data is eventually-consistent by design.
 *
 * Writes run under runAsSystem — audit events span tenants (an anon
 * request has no org) and the AuditLog table's nullable-tenant policy
 * allows writes when role=SYSTEM.
 */
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

    await runAsSystem((tx) =>
      tx.auditLog.create({
        data: {
          organizationId: actor?.orgId ?? null,
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
      }),
    );
  },
);
