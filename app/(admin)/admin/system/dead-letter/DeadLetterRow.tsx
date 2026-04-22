"use client";

import { useState, useTransition } from "react";
import { RotateCw, Check, X } from "lucide-react";
import { retryDeadLetterAction, resolveDeadLetterAction } from "@/lib/actions/system";
import { Button } from "@/components/ui/Button";

type Row = {
  id: string;
  createdAt: string;
  source: string;
  eventType: string;
  error: string;
  attempts: number;
  status: string;
};

export function DeadLetterRow({ row }: { row: Row }) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const active = row.status === "PENDING" || row.status === "RETRIED";

  const retry = () => {
    setErr(null);
    start(async () => {
      try {
        await retryDeadLetterAction({ id: row.id });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Retry failed");
      }
    });
  };

  const resolve = (status: "RESOLVED" | "IGNORED") => {
    setErr(null);
    start(async () => {
      try {
        await resolveDeadLetterAction({ id: row.id, status });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Action failed");
      }
    });
  };

  return (
    <tr className="border-b border-[--color-border] last:border-0 align-top">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[--color-muted-fg]">
        {row.createdAt}
      </td>
      <td className="px-4 py-3 text-[--color-muted-fg]">{row.source}</td>
      <td className="px-4 py-3 font-mono text-xs">{row.eventType}</td>
      <td className="max-w-xs truncate px-4 py-3 text-xs text-[--color-danger]" title={row.error}>
        {row.error}
      </td>
      <td className="px-4 py-3 text-[--color-muted-fg]">{row.attempts}</td>
      <td className="px-4 py-3">
        <span
          className={
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
            (row.status === "PENDING"
              ? "bg-[--color-warning]/10 text-[--color-warning]"
              : row.status === "RESOLVED"
              ? "bg-[--color-success]/10 text-[--color-success]"
              : "bg-[--color-muted] text-[--color-muted-fg]")
          }
        >
          {row.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-end gap-1.5">
          {active ? (
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={retry} disabled={pending}>
                <RotateCw className="h-3.5 w-3.5" /> Retry
              </Button>
              <Button size="sm" variant="outline" onClick={() => resolve("RESOLVED")} disabled={pending}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => resolve("IGNORED")} disabled={pending}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}
          {err ? <span className="text-xs text-[--color-danger]">{err}</span> : null}
        </div>
      </td>
    </tr>
  );
}
