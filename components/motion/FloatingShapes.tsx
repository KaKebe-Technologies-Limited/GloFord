"use client";

import { motion } from "framer-motion";

export function FloatingShapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-[8%] top-[10%] h-24 w-24 rounded-full bg-[--color-accent]/20 blur-2xl"
        animate={{ y: [0, -12, 0], x: [0, 10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[12%] top-[18%] h-32 w-32 rounded-[32px] bg-[--color-primary]/12 blur-2xl"
        animate={{ y: [0, 16, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[12%] left-[20%] h-16 w-16 rounded-full border border-[--color-border] bg-white/40"
        animate={{ y: [0, -10, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
