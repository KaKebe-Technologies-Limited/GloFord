import type { DonationStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<DonationStatus, string> = {
  PENDING: "bg-[--color-muted] text-[--color-muted-fg]",
  SUCCEEDED: "bg-[--color-success]/20 text-[--color-success]",
  FAILED: "bg-[--color-danger]/10 text-[--color-danger]",
  REFUNDED: "bg-[--color-accent]/20 text-[--color-accent-fg]",
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
