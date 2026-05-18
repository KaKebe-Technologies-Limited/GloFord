"use client";

import * as React from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type MaskedFieldProps = {
  value: string;
  label?: string;
  className?: string;
};

export function MaskedField({ value, label, className }: MaskedFieldProps) {
  const [revealed, setRevealed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const masked = value.length > 4
    ? "\u2022".repeat(Math.min(value.length, 24)) + value.slice(-4)
    : "\u2022".repeat(8);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-[var(--color-muted-fg)]">{label}</span>
      )}
      <code
        className={cn(
          "flex-1 rounded-[var(--radius-sm)] bg-[var(--color-muted)] px-2 py-1 text-sm font-mono",
          !revealed && "select-none"
        )}
      >
        {revealed ? value : masked}
      </code>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
        aria-label={revealed ? "Hide value" : "Show value"}
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
        aria-label="Copy to clipboard"
      >
        {copied ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
