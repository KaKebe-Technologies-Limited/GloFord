"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { submitContactAction } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--token-primary)/0.20)]";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      try {
        await submitContactAction(fd);
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
      }
    });
  }

  if (sent) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--token-success)/0.10)]">
            <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-[var(--color-fg)]">Message Sent!</h3>
          <p className="mt-2 text-sm text-[var(--color-muted-fg)]">
            Thank you for reaching out. We&apos;ll get back to you within 24 hours.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
      <h3 className="mb-6 text-xl font-bold text-[var(--color-fg)]">Send Us a Message</h3>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-[rgb(var(--token-danger)/0.10)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Full Name *
            </label>
            <input id="name" name="name" type="text" required className={inputCls} placeholder="Your name" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
              Email *
            </label>
            <input id="email" name="email" type="email" required className={inputCls} placeholder="your@email.com" />
          </div>
        </div>
        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
            Subject *
          </label>
          <input id="subject" name="subject" type="text" required className={inputCls} placeholder="What's this about?" />
        </div>
        <div>
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className={inputCls}
            placeholder="Tell us how we can help..."
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3 font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isPending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
