"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export type LeaderMessageData = {
  id: string;
  leaderName: string;
  title: string;
  role: string;
  photoUrl: string | null;
  message: string;
  signature: string | null;
};

export function LeaderMessageSection({
  messages,
  heading = "Messages from Our Leaders",
}: {
  messages: LeaderMessageData[];
  heading?: string;
}) {
  if (!messages.length) return null;

  return (
    <section className="bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {heading}
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-20">
          {messages.map((msg, i) => (
            <ScrollReveal key={msg.id} delay={i * 0.15}>
              <motion.div
                className={`flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16 ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className="flex-shrink-0 lg:w-80">
                  <div className="relative mx-auto w-64 overflow-hidden rounded-2xl shadow-2xl lg:w-full">
                    {msg.photoUrl ? (
                      <Image
                        src={msg.photoUrl}
                        alt={msg.leaderName}
                        width={400}
                        height={500}
                        className="aspect-[4/5] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br from-[rgb(26_60_52)] to-[rgb(18_42_36)] text-6xl font-bold text-white/30">
                        {msg.leaderName.charAt(0)}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-4">
                      <p className="font-semibold text-white">{msg.leaderName}</p>
                      <p className="text-sm text-white/80">{msg.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="font-display text-2xl font-bold text-[var(--color-fg)]">
                    {msg.title}
                  </h3>
                  <div className="relative">
                    <span className="absolute -left-4 -top-2 font-serif text-5xl text-[var(--color-primary)] opacity-20">
                      &ldquo;
                    </span>
                    <div className="prose prose-lg max-w-none text-[var(--color-muted-fg)]">
                      {msg.message.split("\n").map((para, pi) => (
                        <p key={pi}>{para}</p>
                      ))}
                    </div>
                  </div>
                  {msg.signature && (
                    <p className="font-serif text-lg italic text-[var(--color-primary)]">
                      — {msg.signature}
                    </p>
                  )}
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
