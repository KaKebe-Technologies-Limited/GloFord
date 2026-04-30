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
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-[var(--color-fg)] transition hover:text-[var(--color-primary)]"
              aria-expanded={openId === item.id}
            >
              <span>{item.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition ${openId === item.id ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {openId === item.id ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-lg border border-gray-100 bg-white py-2 shadow-lg"
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.href}
                      className="block px-5 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-[var(--color-primary)]"
                    >
                      {child.label}
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
            className="px-4 py-2 text-sm font-medium text-[var(--color-fg)] transition hover:text-[var(--color-primary)]"
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
