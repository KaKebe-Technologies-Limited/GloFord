import type { SubscriberStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<SubscriberStatus, string> = {
  PENDING: "bg-[--color-muted] text-[--color-muted-fg]",
  ACTIVE: "bg-[--color-success]/20 text-[--color-success]",
  UNSUBSCRIBED: "bg-[--color-muted] text-[--color-muted-fg] line-through",
  BOUNCED: "bg-[--color-danger]/10 text-[--color-danger]",
  COMPLAINED: "bg-[--color-danger]/10 text-[--color-danger]",
};

export function SubscriberStatusBadge({ status }: { status: SubscriberStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
