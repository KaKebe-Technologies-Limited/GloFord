"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export type NavTreeItem = {
  id: string;
  href: string;
  label: string;
  children: Array<{ id: string; href: string; label: string }>;
};

export function PublicNav({ items }: { items: NavTreeItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <nav aria-label="Primary" className="hidden items-center gap-2 lg:flex">
      {items.map((item) =>
        item.children.length > 0 ? (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => setOpenId(item.id)}
            onMouseLeave={() => setOpenId((current) => (current === item.id ? null : current))}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-[--color-fg]/80 transition hover:bg-white/70 hover:text-[--color-fg]"
              aria-expanded={openId === item.id}
            >
              <span>{item.label}</span>
              <ChevronDown className={`h-4 w-4 transition ${openId === item.id ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {openId === item.id ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute left-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-[calc(var(--radius-lg)+0.1rem)] border border-[--color-border] bg-white/95 p-2 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur"
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      className="block rounded-[--radius-md] px-4 py-3 text-sm transition hover:bg-[--color-secondary]"
                    >
                      <span className="font-medium text-[--color-fg]">{child.label}</span>
                    </Link>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-full px-3 py-2 text-sm font-medium text-[--color-fg]/80 transition hover:bg-white/70 hover:text-[--color-fg]"
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
