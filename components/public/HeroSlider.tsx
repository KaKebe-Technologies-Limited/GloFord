"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlideData = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string;
  imageAlt: string | null;
  durationMs: number;
};

export function HeroSlider({ slides }: { slides: HeroSlideData[] }) {
  const t = useTranslations("public.hero");
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const slide = slides[current];
  const duration = slide?.durationMs ?? 3000;

  const next = useCallback(
    () => setCurrent((i) => (i + 1) % slides.length),
    [slides.length],
  );
  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(next, duration);
    return () => clearInterval(timer);
  }, [current, duration, next, paused, slides.length]);

  if (!slides.length || !slide) return null;

  return (
    <section
      className="relative min-h-[85vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slide.imageUrl}
            alt={slide.imageAlt ?? slide.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority={current === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id + "-content"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl space-y-6"
          >
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="max-w-lg text-lg text-white/85 sm:text-xl">
                {slide.subtitle}
              </p>
            )}
            {slide.ctaLabel && slide.ctaHref && (
              <Link
                href={slide.ctaHref}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
              >
                {slide.ctaLabel}
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition hover:bg-white/25"
            aria-label={t("previousSlide")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm transition hover:bg-white/25"
            aria-label={t("nextSlide")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-8 bg-white" : "w-2.5 bg-white/50"
                }`}
                aria-label={t("slideN", { n: i + 1 })}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-white/10">
            <motion.div
              key={current}
              initial={{ width: "0%" }}
              animate={{ width: paused ? undefined : "100%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className="h-full bg-[var(--color-primary)]"
            />
          </div>
        </>
      )}
    </section>
  );
}
