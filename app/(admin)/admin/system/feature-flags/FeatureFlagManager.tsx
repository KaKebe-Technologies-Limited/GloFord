"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { upsertFeatureFlagAction, deleteFeatureFlagAction } from "@/lib/actions/system";
import { Button } from "@/components/ui/Button";

type Flag = {
  id: string;
  key: string;
  description: string;
  isEnabled: boolean;
  isGlobal: boolean;
};

export function FeatureFlagManager({ flags }: { flags: Flag[] }) {
  const [draft, setDraft] = useState({ key: "", description: "", isEnabled: false });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (key: string, description: string, isEnabled: boolean) => {
    setError(null);
    start(async () => {
      try {
        await upsertFeatureFlagAction({ key, description: description || undefined, isEnabled });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const add = () => {
    if (!draft.key.trim()) return;
    save(draft.key.trim(), draft.description.trim(), draft.isEnabled);
    setDraft({ key: "", description: "", isEnabled: false });
  };

  const del = (id: string) => {
    if (!confirm("Delete this flag?")) return;
    start(async () => {
      try {
        await deleteFeatureFlagAction({ id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  const orgFlags = flags.filter((f) => !f.isGlobal);
  const globalFlags = flags.filter((f) => f.isGlobal);

  return (
    <div className="space-y-8">
      {error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-3 text-sm text-[var(--color-danger)]"
        >
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
          Tenant flags
        </h2>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
          {orgFlags.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--color-muted-fg)]">No tenant-level flags yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {orgFlags.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <code className="rounded bg-[var(--color-muted)] px-2 py-0.5 text-xs">{f.key}</code>
                  <span className="flex-1 text-sm text-[var(--color-muted-fg)]">{f.description || "—"}</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      defaultChecked={f.isEnabled}
                      onChange={(e) => save(f.key, f.description, e.target.checked)}
                      disabled={pending}
                    />
                    Enabled
                  </label>
                  <Button size="sm" variant="outline" onClick={() => del(f.id)} disabled={pending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:grid-cols-[1fr_1fr_auto_auto]">
          <input
            value={draft.key}
            onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
            placeholder="flag.key"
            className={inputCls}
          />
          <input
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Description (optional)"
            className={inputCls}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isEnabled}
              onChange={(e) => setDraft((d) => ({ ...d, isEnabled: e.target.checked }))}
            />
            Enabled
          </label>
          <Button onClick={add} disabled={pending || !draft.key.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </section>

      {globalFlags.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
            Global flags (read-only)
          </h2>
          <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
            {globalFlags.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <code className="rounded bg-[var(--color-muted)] px-2 py-0.5 text-xs">{f.key}</code>
                <span className="flex-1 text-sm text-[var(--color-muted-fg)]">
                  {f.description || "—"}
                </span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-xs " +
                    (f.isEnabled
                      ? "bg-[rgb(var(--token-success)/0.10)] text-[var(--color-success)]"
                      : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]")
                  }
                >
                  {f.isEnabled ? "On" : "Off"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";
