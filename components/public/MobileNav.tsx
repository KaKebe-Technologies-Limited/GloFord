"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type Item = { href: string; label: string };

export function MobileNav({ items, donateLabel }: { items: readonly Item[]; donateLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-[--radius-md] border border-[--color-border]"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open ? (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-[--color-border] bg-[--color-bg] p-4 shadow-lg">
          <nav aria-label="Mobile" className="flex flex-col gap-2">
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                className="rounded-[--radius-md] px-3 py-2 text-sm hover:bg-[--color-muted]"
              >
                {i.label}
              </Link>
            ))}
            <Link
              href="/donate"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] px-4 py-2 text-sm font-medium text-[--color-primary-fg]"
            >
              {donateLabel}
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
