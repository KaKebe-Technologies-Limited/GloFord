"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X, ChevronDown, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { NavTreeItem } from "./PublicNav";

export function MobileNav({
  items,
  donateLabel,
}: {
  items: readonly NavTreeItem[];
  donateLabel: string;
}) {
  const t = useTranslations("public.nav");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-fg)]"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-x-0 top-[5rem] z-40 border-b border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-lg"
          >
            <nav aria-label="Mobile" className="flex max-h-[calc(100dvh-7rem)] flex-col gap-1 overflow-y-auto">
              {items.map((item) =>
                item.children.length > 0 ? (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => setExpanded((current) => (current === item.id ? null : item.id))}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--color-fg)]"
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`h-4 w-4 text-[var(--color-muted-fg)] transition ${expanded === item.id ? "rotate-180" : ""}`} />
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
                          <div className="space-y-0.5 border-l-2 border-[rgb(var(--token-primary)/0.20)] ml-4 pl-3 pb-2">
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                href={child.href}
                                onClick={() => setOpen(false)}
                                className="block py-2 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-primary)]"
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
                    className="px-4 py-3 text-sm font-semibold text-[var(--color-fg)] hover:text-[var(--color-primary)]"
                  >
                    {item.label}
                  </Link>
                ),
              )}
              <Link
                href="/donate"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white"
              >
                <Heart className="h-4 w-4" />
                {donateLabel}
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
