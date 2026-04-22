"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { refundDonationAction } from "@/lib/actions/donations";
import { Button } from "@/components/ui/Button";

export function RefundButton({ id, amountLabel }: { id: string; amountLabel: string }) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const refund = () => {
    const reason = prompt(
      `Refund ${amountLabel} to the donor?\n\nOptional reason (logged with the refund):`,
    );
    if (reason === null) return;
    setErr(null);
    start(async () => {
      try {
        await refundDonationAction({ id, reason: reason || undefined });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Refund failed");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={refund} disabled={pending}>
        <RotateCcw className="h-3.5 w-3.5" /> Refund
      </Button>
      {err ? <span className="max-w-[180px] text-xs text-[--color-danger]">{err}</span> : null}
    </div>
  );
}
