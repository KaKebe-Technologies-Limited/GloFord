import type { SubscriberStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<SubscriberStatus, string> = {
  PENDING: "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
  ACTIVE: "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]",
  UNSUBSCRIBED: "bg-[var(--color-muted)] text-[var(--color-muted-fg)] line-through",
  BOUNCED: "bg-[rgb(var(--token-danger)/0.10)] text-[var(--color-danger)]",
  COMPLAINED: "bg-[rgb(var(--token-danger)/0.10)] text-[var(--color-danger)]",
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
