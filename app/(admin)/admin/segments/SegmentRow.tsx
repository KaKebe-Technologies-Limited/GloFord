"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSegmentAction } from "@/lib/actions/segments";
import { useConfirmAction } from "@/components/ui/useConfirmAction";

type Props = {
  segment: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    _count: { subscribers: number };
  };
};

export function SegmentRow({ segment }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirmAction = useConfirmAction();
  const del = async () => {
    if (segment.isSystem) return;
    const ok = await confirmAction({
      title: "Delete segment",
      description: `Delete segment "${segment.name}"? Subscribers remain.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    start(async () => {
      try {
        await deleteSegmentAction({ id: segment.id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  };
  return (
    <tr className="border-b border-[var(--color-border)] last:border-0">
      <td className="px-4 py-3 font-medium">
        {segment.name}
        {error && <p className="text-xs text-[var(--color-danger)] mt-1">{error}</p>}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">{segment.slug}</td>
      <td className="px-4 py-3 text-[var(--color-muted-fg)]">{segment._count.subscribers}</td>
      <td className="px-4 py-3 text-xs text-[var(--color-muted-fg)]">
        {segment.isSystem ? "System" : "Custom"}
      </td>
      <td className="px-4 py-3 text-right">
        {segment.isSystem ? (
          <span className="text-xs text-[var(--color-muted-fg)]">locked</span>
        ) : (
          <button
            type="button"
            onClick={del}
            disabled={pending}
            aria-label={`Delete ${segment.name}`}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-danger)] hover:bg-[rgb(var(--token-danger)/0.10)]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
