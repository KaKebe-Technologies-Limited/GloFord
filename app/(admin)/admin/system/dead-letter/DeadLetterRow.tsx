"use client";

import { useState, useTransition } from "react";
import { RotateCw, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { retryDeadLetterAction, resolveDeadLetterAction } from "@/lib/actions/system";
import { Button } from "@/components/ui/Button";

type Row = {
  id: string;
  createdAt: string;
  source: string;
  eventType: string;
  error: string;
  payload: Record<string, unknown> | null;
  attempts: number;
  status: string;
};

export function DeadLetterRow({ row }: { row: Row }) {
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
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
    <>
      <tr className="border-b border-[var(--color-border)] last:border-0 align-top hover:bg-[rgb(var(--token-muted)/0.20)]">
        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">
          {row.createdAt}
        </td>
        <td className="px-4 py-3 text-[var(--color-muted-fg)]">{row.source}</td>
        <td className="px-4 py-3 font-mono text-xs">{row.eventType}</td>
        <td className="max-w-xs px-4 py-3 text-xs text-[var(--color-danger)]">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-left hover:underline"
            title={row.error}
          >
            <span className="truncate max-w-[200px]">{row.error}</span>
            {expanded ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
          </button>
        </td>
        <td className="px-4 py-3 text-center text-[var(--color-muted-fg)]">
          <span title={`${row.attempts}/5 attempts`}>{row.attempts}/5</span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={row.status} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col items-end gap-1.5">
            {active ? (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={retry} disabled={pending || row.attempts >= 5} title="Retry">
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => resolve("RESOLVED")} disabled={pending} title="Mark resolved">
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => resolve("IGNORED")} disabled={pending} title="Ignore">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : null}
            {err ? <span className="text-xs text-[var(--color-danger)]">{err}</span> : null}
          </div>
        </td>
      </tr>
      {/* Expanded payload + error detail */}
      {expanded && (
        <tr className="border-b border-[var(--color-border)]">
          <td colSpan={7} className="bg-[var(--color-muted)] px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
                  Error message
                </p>
                <pre className="whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--color-bg)] p-3 font-mono text-xs text-[var(--color-danger)]">
                  {row.error}
                </pre>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
                  Event payload
                </p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--color-bg)] p-3 font-mono text-xs">
                  {row.payload ? JSON.stringify(row.payload, null, 2) : "No payload"}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "PENDING"
      ? "bg-[rgb(239_180_0/0.10)] text-amber-600"
      : status === "RESOLVED"
        ? "bg-[rgb(var(--token-success)/0.10)] text-[var(--color-success)]"
        : status === "RETRIED"
          ? "bg-[rgb(var(--token-primary)/0.10)] text-[var(--color-primary)]"
          : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
