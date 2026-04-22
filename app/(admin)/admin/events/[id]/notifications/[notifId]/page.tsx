import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { getEventNotificationForEdit } from "@/lib/services/events";
import { NotificationEditor } from "./NotificationEditor";
import type { Block } from "@/lib/blocks/types";

export const metadata = { title: "Edit notification" };

export default async function EditEventNotificationPage({
  params,
}: {
  params: Promise<{ id: string; notifId: string }>;
}) {
  const { id, notifId } = await params;
  const actor = await requireActorFromSession();
  const row = await getEventNotificationForEdit(actor.orgId, notifId);
  if (!row || row.event.id !== id) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/events/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[--color-muted-fg] hover:text-[--color-fg]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to {row.event.title}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Edit notification</h1>
        <p className="text-sm text-[--color-muted-fg]">
          {row.type === "REMINDER" ? "Reminder" : "Announcement"} · scheduled for{" "}
          {row.sendAt.toLocaleString()} · {row.status}
        </p>
      </header>

      <NotificationEditor
        initial={{
          id: row.id,
          type: row.type,
          subject: row.subject,
          sendAt: row.sendAt.toISOString(),
          content: (row.content as Block[]) ?? [],
          status: row.status,
        }}
      />
    </div>
  );
}
