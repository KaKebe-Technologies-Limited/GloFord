import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/activity-stream
 * Server-Sent Events endpoint that pushes new audit log entries to
 * connected admin clients every 5 seconds.
 */
export async function GET() {
  await requireActorFromSession();

  const encoder = new TextEncoder();
  let lastId: string | null = null;
  let closed = false;

  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial batch (last 10 events)
      const initial = await db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          module: true,
          entityType: true,
          entityId: true,
          userId: true,
          createdAt: true,
        },
      });

      if (initial.length > 0) {
        lastId = initial[0]!.id;
        const payload = initial.reverse().map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }));
        controller.enqueue(
          encoder.encode(`event: init\ndata: ${JSON.stringify(payload)}\n\n`),
        );
      }

      // Poll for new events every 5s
      intervalHandle = setInterval(async () => {
        if (closed) {
          if (intervalHandle) clearInterval(intervalHandle);
          return;
        }
        try {
          const where = lastId ? { id: { gt: lastId } } : {};
          const newEvents = await db.auditLog.findMany({
            where,
            orderBy: { createdAt: "asc" },
            take: 20,
            select: {
              id: true,
              action: true,
              module: true,
              entityType: true,
              entityId: true,
              userId: true,
              createdAt: true,
            },
          });

          if (newEvents.length > 0) {
            lastId = newEvents[newEvents.length - 1]!.id;
            for (const evt of newEvents) {
              controller.enqueue(
                encoder.encode(
                  `event: activity\ndata: ${JSON.stringify({ ...evt, createdAt: evt.createdAt.toISOString() })}\n\n`,
                ),
              );
            }
          } else {
            // Send heartbeat to keep connection alive
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          }
        } catch {
          // DB error — send heartbeat, don't kill the stream
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        }
      }, 5000);

    },
    cancel() {
      closed = true;
      if (intervalHandle) clearInterval(intervalHandle);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
