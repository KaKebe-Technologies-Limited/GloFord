"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2, Eye } from "lucide-react";
import { markReadAction, deleteMessageAction } from "./actions";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
};

export function ContactMessagesClient({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Message | null>(null);

  async function handleMarkRead(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    await markReadAction(fd);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    await deleteMessageAction(fd);
    setSelected(null);
    router.refresh();
  }

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contact Messages</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
            {messages.filter((m) => !m.isRead).length} unread messages
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Message list */}
        <div className="space-y-2 lg:col-span-2">
          {messages.length === 0 ? (
            <p className="py-12 text-center text-[var(--color-muted-fg)]">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  setSelected(msg);
                  if (!msg.isRead) handleMarkRead(msg.id);
                }}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selected?.id === msg.id
                    ? "border-[var(--color-primary)] bg-[rgb(var(--token-primary)/0.5)]"
                    : "border-[var(--color-border)] hover:bg-[rgb(var(--token-muted)/0.30)]"
                } ${!msg.isRead ? "border-l-4 border-l-[var(--color-primary)]" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${!msg.isRead ? "text-[var(--color-fg)]" : "text-[var(--color-muted-fg)]"}`}>
                    {msg.name}
                  </span>
                  <span className="text-xs text-[var(--color-muted-fg)]">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="mt-1 truncate text-sm font-medium text-[var(--color-fg)]">{msg.subject}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--color-muted-fg)]">{msg.message}</p>
              </button>
            ))
          )}
        </div>

        {/* Message detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-fg)]">{selected.subject}</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
                    From: <strong>{selected.name}</strong> ({selected.email})
                  </p>
                  <p className="text-xs text-[var(--color-muted-fg)]">{formatDate(selected.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                    className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-primary)] hover:bg-[rgb(var(--token-muted)/0.30)]"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-danger)] hover:bg-[rgb(var(--token-danger)/0.10)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-fg)]">
                {selected.message}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]">
              <div className="text-center text-[var(--color-muted-fg)]">
                <Eye className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">Select a message to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
