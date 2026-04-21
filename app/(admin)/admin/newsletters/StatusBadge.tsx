import type { NewsletterStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<NewsletterStatus, string> = {
  DRAFT: "bg-[--color-muted] text-[--color-muted-fg]",
  SCHEDULED: "bg-[--color-accent]/20 text-[--color-accent-fg]",
  SENDING: "bg-[--color-primary]/20 text-[--color-primary]",
  SENT: "bg-[--color-success]/20 text-[--color-success]",
  FAILED: "bg-[--color-danger]/10 text-[--color-danger]",
  CANCELED: "bg-[--color-muted] text-[--color-muted-fg] line-through",
};

export function NewsletterStatusBadge({ status }: { status: NewsletterStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[status])}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
