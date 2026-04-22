"use client";

import { useState, useTransition } from "react";
import { restoreVersionAction } from "@/lib/actions/system";
import { Button } from "@/components/ui/Button";

export function RestoreButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const restore = () => {
    if (!confirm("Restore to this version? The entity will be overwritten with this snapshot.")) {
      return;
    }
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
      {err ? <span className="text-xs text-[--color-danger]">{err}</span> : null}
    </div>
  );
}
