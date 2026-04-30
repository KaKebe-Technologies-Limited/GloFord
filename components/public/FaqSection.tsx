"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export type FaqData = {
  id: string;
  question: string;
  answer: string;
};

export function FaqSection({
  faqs,
  heading,
}: {
  faqs: FaqData[];
  heading?: string;
}) {
  const t = useTranslations("public.faq");
  const [openId, setOpenId] = useState<string | null>(null);

  if (!faqs.length) return null;

  return (
    <section className="bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {heading ?? t("defaultHeading")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={faq.id} delay={i * 0.05}>
              <div className="rounded-xl border border-[var(--color-border)] bg-white transition hover:shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setOpenId((c) => (c === faq.id ? null : faq.id))
                  }
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  aria-expanded={openId === faq.id}
                >
                  <span className="pr-4 font-semibold text-[var(--color-fg)]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-[var(--color-muted-fg)] transition-transform duration-200 ${
                      openId === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[var(--color-border)] px-6 py-5 text-[var(--color-muted-fg)]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
