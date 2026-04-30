import type { DonationStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<DonationStatus, string> = {
  PENDING: "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
  SUCCEEDED: "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]",
  FAILED: "bg-[rgb(var(--token-danger)/0.10)] text-[var(--color-danger)]",
  REFUNDED: "bg-[rgb(var(--token-accent)/0.20)] text-[var(--color-accent-fg)]",
};

export function DonationStatusBadge({ status }: { status: DonationStatus }) {
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
