"use client";

import { useState, useTransition } from "react";
import { createSegmentAction } from "@/lib/actions/segments";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export function SegmentCreator() {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    start(async () => {
      try {
        await createSegmentAction({ slug, name, description: description || undefined });
        setSlug("");
        setName("");
        setDescription("");
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create");
      }
    });
  };

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New segment
      </Button>
    );
  }

  return (
    <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5">
      <h2 className="font-semibold">New segment</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-[--radius-sm] bg-[--color-danger]/10 p-2 text-sm text-[--color-danger]">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? "Creating\u2026" : "Create segment"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";
