"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSegmentAction } from "@/lib/actions/segments";

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
  const del = () => {
    if (segment.isSystem) return;
    if (!confirm(`Delete segment "${segment.name}"? Subscribers remain.`)) return;
    start(async () => {
      try {
        await deleteSegmentAction({ id: segment.id });
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed");
      }
    });
  };
  return (
    <tr className="border-b border-[var(--color-border)] last:border-0">
      <td className="px-4 py-3 font-medium">{segment.name}</td>
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
