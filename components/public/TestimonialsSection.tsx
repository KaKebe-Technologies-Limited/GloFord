"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

export type TestimonialData = {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string | null;
  authorOrg: string | null;
  avatarUrl: string | null;
  rating: number | null;
};

export function TestimonialsSection({
  testimonials,
  heading,
  subheading,
}: {
  testimonials: TestimonialData[];
  heading?: string;
  subheading?: string;
}) {
  const t = useTranslations("public.testimonials");
  const [current, setCurrent] = useState(0);

  const next = useCallback(
    () => setCurrent((i) => (i + 1) % testimonials.length),
    [testimonials.length],
  );
  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + testimonials.length) % testimonials.length),
    [testimonials.length],
  );

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [current, next, testimonials.length]);

  if (!testimonials.length) return null;

  const item = testimonials[current]!;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[rgb(248_250_249)] via-[rgb(240_247_244)] to-[rgb(230_242_236)] py-20 sm:py-28">
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[var(--color-primary)]" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-[var(--color-primary)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">{heading ?? t("defaultHeading")}</h2>
          {subheading && <p className="mt-3 text-[var(--color-muted-fg)]">{subheading}</p>}
        </div>

        <div className="relative min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              <Quote className="mb-6 h-10 w-10 text-[var(--color-accent)] opacity-60" />

              <blockquote className="max-w-3xl text-lg leading-relaxed text-[rgb(var(--token-fg)/0.80)] sm:text-xl md:text-2xl">
                &ldquo;{item.quote}&rdquo;
              </blockquote>

              <div className="mt-8 flex items-center gap-4">
                {item.avatarUrl ? (
                  <Image
                    src={item.avatarUrl}
                    alt={item.authorName}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full border-2 border-[rgb(var(--token-primary)/0.20)] object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--token-primary)/0.10)] text-lg font-bold text-[var(--color-primary)]">
                    {item.authorName.charAt(0)}
                  </div>
                )}
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-fg)]">{item.authorName}</p>
                  {(item.authorRole || item.authorOrg) && (
                    <p className="text-sm text-[var(--color-muted-fg)]">
                      {[item.authorRole, item.authorOrg].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {item.rating !== null && item.rating > 0 && (
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-lg ${i < item.rating! ? "text-yellow-400" : "text-[rgb(var(--token-muted-fg)/0.20)]"}`}>
                      ★
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {testimonials.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-fg)] transition hover:bg-[var(--color-muted)]"
            aria-label={t("previousTestimonial")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? "w-6 bg-[var(--color-primary)]" : "w-2 bg-[rgb(var(--token-primary)/0.30)]"
                  }`}
                  aria-label={t("testimonialN", { n: i + 1 })}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-fg)] transition hover:bg-[var(--color-muted)]"
            aria-label={t("nextTestimonial")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
