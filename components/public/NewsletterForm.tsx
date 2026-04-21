"use client";

import { useState, useTransition } from "react";
import { subscribeAction } from "@/lib/actions/subscribers";
import { Button } from "@/components/ui/Button";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const [state, setState] = useState<"idle" | "sent" | "already" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const result = await subscribeAction({ email, name: name || undefined, source });
        setState(result.alreadyActive ? "already" : "sent");
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  if (state === "sent") {
    return (
      <p role="status" className="text-sm text-[--color-muted-fg]">
        Check your inbox \u2014 we\u2019ve sent a confirmation link to <strong>{email}</strong>.
      </p>
    );
  }
  if (state === "already") {
    return (
      <p role="status" className="text-sm text-[--color-muted-fg]">
        You\u2019re already subscribed.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block">
        <span className="sr-only">Name</span>
        <input
          type="text"
          placeholder="Your name (optional)"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="sr-only">Email</span>
        <input
          type="email"
          required
          placeholder="Email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit" disabled={pending} size="sm" className="w-full">
        {pending ? "Subscribing\u2026" : "Subscribe"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-[--color-danger]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
