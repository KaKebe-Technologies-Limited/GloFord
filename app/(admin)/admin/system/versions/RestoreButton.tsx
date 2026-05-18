"use client";

import { useState, useTransition } from "react";
import { restoreVersionAction } from "@/lib/actions/system";
import { Button } from "@/components/ui/Button";
import { useConfirmAction } from "@/components/ui/useConfirmAction";

export function RestoreButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const confirmAction = useConfirmAction();
  const restore = async () => {
    const ok = await confirmAction({
      title: "Restore version",
      description: "Restore to this version? The entity will be overwritten with this snapshot.",
      confirmLabel: "Restore",
      variant: "primary",
    });
    if (!ok) return;
    setErr(null);
    start(async () => {
      try {
        await restoreVersionAction({ id });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to restore");
      }
    });
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={restore} disabled={pending}>
        {pending ? "Restoring…" : "Restore"}
      </Button>
      {err ? <span className="text-xs text-[var(--color-danger)]">{err}</span> : null}
    </div>
  );
}
