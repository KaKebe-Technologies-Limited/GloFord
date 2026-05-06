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


const PRESETS: Record<string, Initial> = {
  "Gloford Forest": {
    colors: {
      "bg": "245 248 245", "surface-2": "235 242 236", "fg": "10 10 11",
      "muted": "243 245 243", "muted-fg": "100 107 105", "card": "255 255 255",
      "card-fg": "10 10 11", "hairline": "26 60 52", "input": "235 242 236",
      "ring": "26 60 52", "primary": "26 60 52", "primary-fg": "255 255 255",
      "secondary": "235 242 236", "secondary-fg": "10 10 11",
      "accent": "13 122 61", "accent-fg": "255 255 255",
      "danger": "239 68 68", "danger-fg": "255 255 255",
      "success": "34 197 94", "border": "220 230 220",
    },
        typography: { "sans": "'Inter', ui-sans-serif, system-ui, sans-serif", "serif": "'Playfair Display', ui-serif, Georgia, serif" },
    radius: { "sm": "0.25rem", "md": "0.5rem", "lg": "0.75rem" },
    shadows: {},
  },
  "Ocean Blue": {
    colors: {
      "bg": "245 248 252", "surface-2": "230 240 250", "fg": "10 10 30",
      "muted": "235 242 250", "muted-fg": "90 110 140", "card": "255 255 255",
      "card-fg": "10 10 30", "hairline": "30 80 160", "input": "225 235 248",
      "ring": "30 80 160", "primary": "30 80 160", "primary-fg": "255 255 255",
      "secondary": "225 235 248", "secondary-fg": "10 10 30",
      "accent": "14 130 200", "accent-fg": "255 255 255",
      "danger": "239 68 68", "danger-fg": "255 255 255",
      "success": "34 197 94", "border": "200 220 240",
    },
    typography: { "sans": "'Inter', ui-sans-serif, system-ui, sans-serif", "serif": "'Playfair Display', ui-serif, Georgia, serif" },
    radius: { "sm": "0.3rem", "md": "0.6rem", "lg": "1rem" },
    shadows: {},
  },
  "Warm Amber": {
    colors: {
      "bg": "252 248 240", "surface-2": "245 235 215", "fg": "30 20 5",
      "muted": "245 238 220", "muted-fg": "120 90 50", "card": "255 252 245",
      "card-fg": "30 20 5", "hairline": "160 100 20", "input": "240 228 205",
      "ring": "160 100 20", "primary": "160 100 20", "primary-fg": "255 255 255",
      "secondary": "240 228 205", "secondary-fg": "30 20 5",
      "accent": "200 130 30", "accent-fg": "255 255 255",
      "danger": "239 68 68", "danger-fg": "255 255 255",
      "success": "34 197 94", "border": "230 210 175",
    },
    typography: { "sans": "'Inter', ui-sans-serif, system-ui, sans-serif", "serif": "'Playfair Display', ui-serif, Georgia, serif" },
    radius: { "sm": "0.2rem", "md": "0.4rem", "lg": "0.6rem" },
    shadows: {},
  },
  "Slate Purple": {
    colors: {
      "bg": "248 246 252", "surface-2": "235 230 248", "fg": "15 10 30",
      "muted": "238 234 250", "muted-fg": "100 90 130", "card": "255 255 255",
      "card-fg": "15 10 30", "hairline": "90 60 160", "input": "228 222 245",
      "ring": "90 60 160", "primary": "90 60 160", "primary-fg": "255 255 255",
      "secondary": "228 222 245", "secondary-fg": "15 10 30",
      "accent": "120 80 200", "accent-fg": "255 255 255",
      "danger": "239 68 68", "danger-fg": "255 255 255",
      "success": "34 197 94", "border": "215 205 240",
    },
    typography: { "sans": "'Inter', ui-sans-serif, system-ui, sans-serif", "serif": "'Playfair Display', ui-serif, Georgia, serif" },
    radius: { "sm": "0.375rem", "md": "0.75rem", "lg": "1.25rem" },
    shadows: {},
  },
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

      {/* Preset themes */}
      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">Preset Themes</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => setGroups(preset)}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
            >
              {name}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted-fg)]">Click a preset to load it, then click Save theme to apply.</p>
      </section>


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
