"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateThemeAction } from "@/lib/actions/theme";
import { Button } from "@/components/ui/Button";

type TokenMap = Record<string, string>;
type Initial = {
  colors: TokenMap;
  typography: TokenMap;
  radius: TokenMap;
  shadows: TokenMap;
};

type GroupKey = keyof Initial;

const GROUP_LABELS: Record<GroupKey, string> = {
  colors: "Colors",
  typography: "Typography",
  radius: "Radius",
  shadows: "Shadows",
};

export function ThemeEditor({ initial }: { initial: Initial }) {
  const [groups, setGroups] = useState<Initial>(initial);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const updateToken = (group: GroupKey, key: string, value: string) => {
    setGroups((s) => ({ ...s, [group]: { ...s[group], [key]: value } }));
  };
  const addToken = (group: GroupKey) => {
    const key = prompt(`New ${GROUP_LABELS[group]} token name (e.g. primary):`);
    if (!key) return;
    if (groups[group][key]) return;
    updateToken(group, key, "");
  };
  const removeToken = (group: GroupKey, key: string) => {
    setGroups((s) => {
      const next = { ...s[group] };
      delete next[key];
      return { ...s, [group]: next };
    });
  };

  const save = () => {
    setError(null);
    setSaved(false);
    start(async () => {
      try {
        await updateThemeAction(groups);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const pasteJson = () => {
    try {
      const parsed = JSON.parse(pasteText) as Partial<Initial>;
      setGroups((s) => ({
        colors: { ...s.colors, ...(parsed.colors ?? {}) },
        typography: { ...s.typography, ...(parsed.typography ?? {}) },
        radius: { ...s.radius, ...(parsed.radius ?? {}) },
        shadows: { ...s.shadows, ...(parsed.shadows ?? {}) },
      }));
      setPasteOpen(false);
      setPasteText("");
    } catch {
      setError("That isn't valid JSON.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        {(Object.keys(GROUP_LABELS) as GroupKey[]).map((group) => {
          const entries = Object.entries(groups[group]);
          return (
            <section
              key={group}
              className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
                  {GROUP_LABELS[group]}
                </h2>
                <Button size="sm" variant="outline" onClick={() => addToken(group)}>
                  Add token
                </Button>
              </div>
              {entries.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-fg)]">No tokens yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {entries.map(([k, v]) => (
                    <li key={k} className="flex items-center gap-2">
                      <code className="min-w-[9rem] rounded-[var(--radius-sm)] bg-[var(--color-muted)] px-2 py-1 text-xs">
                        {k}
                      </code>
                      <input
                        aria-label={`${group}.${k} value`}
                        value={v}
                        onChange={(e) => updateToken(group, k, e.target.value)}
                        className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-input)] bg-[var(--color-bg)] px-2 py-1 text-sm font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeToken(group, k)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
              Paste JSON (merge)
            </h2>
            <Button size="sm" variant="outline" onClick={() => setPasteOpen((v) => !v)}>
              {pasteOpen ? "Hide" : "Show"}
            </Button>
          </div>
          {pasteOpen ? (
            <>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={10}
                placeholder='{"colors": {"primary": "212 92% 38%"}, "radius": {"md": "0.5rem"}}'
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] p-3 font-mono text-xs"
              />
              <Button size="sm" onClick={pasteJson} disabled={!pasteText.trim()}>
                Merge into tokens
              </Button>
            </>
          ) : null}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          {error ? (
            <p
              role="alert"
              className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-2 text-sm text-[var(--color-danger)]"
            >
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-success)/0.10)] p-2 text-sm text-[var(--color-success)]">
              Theme saved. Reload the public site to see updates.
            </p>
          ) : null}
          <Button onClick={save} disabled={pending} className="w-full">
            <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save theme"}
          </Button>
          <p className="text-xs text-[var(--color-muted-fg)]">
            Token names should match your CSS custom-property names (without the{" "}
            <code>--</code> prefix).
          </p>
        </div>
      </aside>
    </div>
  );
}
