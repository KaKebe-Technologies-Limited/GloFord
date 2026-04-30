"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/**
 * Extracts the leading number from a string like "120k+" → 120,
 * "14" → 14, "$5M" → 5, "40+" → 40. Returns null if no number found.
 */
function extractNumber(value: string): { num: number; prefix: string; suffix: string } | null {
  const match = value.match(/^([^0-9]*?)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const num = parseFloat(match[2]!.replace(/,/g, ""));
  if (isNaN(num)) return null;
  return { num, prefix: match[1] ?? "", suffix: match[3] ?? "" };
}

function formatNumber(n: number, hasDecimals: boolean): string {
  if (hasDecimals) return n.toFixed(1);
  return Math.round(n).toLocaleString("en-US");
}

export function AnimatedCounter({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const parsed = extractNumber(value);
  // Show "0" formatted version until animation starts
  const zeroDisplay = parsed
    ? `${parsed.prefix}${formatNumber(0, value.includes("."))}${parsed.suffix}`
    : value;
  const [display, setDisplay] = useState(zeroDisplay);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!isInView || !parsed || hasAnimated) return;
    setHasAnimated(true);

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    const hasDecimals = value.includes(".");
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * parsed.num;
      setDisplay(`${parsed.prefix}${formatNumber(current, hasDecimals)}${parsed.suffix}`);
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(value); // snap to exact final value
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isInView, parsed, value, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
