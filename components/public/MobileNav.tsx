"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { NavTreeItem } from "./PublicNav";

export function MobileNav({
  items,
  donateLabel,
}: {
  items: readonly NavTreeItem[];
  donateLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[--color-border] bg-white/80 shadow-sm"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-x-0 top-20 z-40 border-b border-[--color-border] bg-white/95 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl"
          >
            <nav aria-label="Mobile" className="flex max-h-[calc(100dvh-7rem)] flex-col gap-2 overflow-y-auto">
              {items.map((item) =>
                item.children.length > 0 ? (
                  <div key={item.id} className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-secondary]/70">
                    <button
                      type="button"
                      onClick={() => setExpanded((current) => (current === item.id ? null : item.id))}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`h-4 w-4 transition ${expanded === item.id ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded === item.id ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1 px-2 pb-2">
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                href={child.href}
                                onClick={() => setOpen(false)}
                                className="block rounded-[--radius-md] px-3 py-2 text-sm text-[--color-muted-fg] hover:bg-white"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-[--radius-lg] border border-transparent px-4 py-3 text-sm font-semibold hover:border-[--color-border] hover:bg-[--color-secondary]/70"
                  >
                    {item.label}
                  </Link>
                ),
              )}
              <Link
                href="/donate"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-[--color-primary] px-4 py-3 text-sm font-semibold text-[--color-primary-fg]"
              >
                {donateLabel}
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
