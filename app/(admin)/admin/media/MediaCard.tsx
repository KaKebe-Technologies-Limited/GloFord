"use client";

import { useTransition } from "react";
import { Trash2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { deleteMediaAction } from "@/lib/actions/media";
import { cn } from "@/lib/utils/cn";

type Item = {
  id: string;
  url: string;
  mime: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

export function MediaCard({ item }: { item: Item }) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const del = () => {
    if (!confirm("Delete this media file?")) return;
    start(() => deleteMediaAction({ id: item.id }));
  };

  return (
    <figure className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="aspect-square bg-[var(--color-muted)]">
        {item.mime.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-[var(--color-muted-fg)]">
            {item.mime}
          </div>
        )}
      </div>
      <figcaption className={cn("flex items-center justify-between gap-1 p-2", pending && "opacity-50")}>
        <button
          onClick={copy}
          aria-label="Copy media id"
          className="inline-flex items-center gap-1 truncate rounded-[var(--radius-sm)] px-2 py-1 text-xs hover:bg-[var(--color-muted)]"
          title={item.id}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span className="truncate font-mono">{item.id.slice(0, 8)}\u2026</span>
        </button>
        <button
          onClick={del}
          disabled={pending}
          aria-label="Delete media"
          className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-danger)] hover:bg-[rgb(var(--token-danger)/0.10)]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </figcaption>
    </figure>
  );
}
