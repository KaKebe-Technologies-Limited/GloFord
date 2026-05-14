"use client";

import { useState, useCallback } from "react";
import { Save, Check, Palette, Undo2 } from "lucide-react";
import { updateThemeAction } from "@/lib/actions/theme";
import { Button } from "@/components/ui/Button";

type TokenMap = Record<string, string>;
type ThemeData = {
  colors: TokenMap;
  typography: TokenMap;
  radius: TokenMap;
  shadows: TokenMap;
};

type Preset = {
  id: string;
  name: string;
  slug: string;
  colors: TokenMap;
  typography: TokenMap;
  radius: TokenMap;
  shadows: TokenMap;
  builtIn: boolean;
};

type GroupKey = keyof ThemeData;

const GROUP_LABELS: Record<GroupKey, string> = {
  colors: "Colors",
  typography: "Typography",
  radius: "Radius",
  shadows: "Shadows",
};

/* ── RGB ↔ Hex conversion ── */
function rgbTripletToHex(triplet: string): string {
  const parts = triplet.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "#000000";
  return (
    "#" +
    parts
      .map((n) =>
        Math.max(0, Math.min(255, n))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "0 0 0";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const CSS_TOKEN_KEY = /^[a-z][a-z0-9-]*$/;

/**
 * Apply theme tokens as inline styles on <html>.
 *
 * Inline styles beat ALL stylesheet rules (including !important),
 * so this reliably overrides the server-rendered :root style from
 * layout.tsx, the static :root defaults in globals.css, and anything
 * Tailwind generates.
 *
 * We track which properties we've set so clearTokensFromDOM() can
 * cleanly remove them without touching other inline styles.
 */
const managedProps = new Set<string>();

function applyTokensToDOM(data: ThemeData) {
  const html = document.documentElement;
  const props: Array<[string, string]> = [];

  for (const [k, v] of Object.entries(data.colors))
    props.push([`--token-${k}`, v]);
  for (const [k, v] of Object.entries(data.typography))
    props.push([`--token-font-${k}`, v]);
  for (const [k, v] of Object.entries(data.radius))
    props.push([`--token-radius-${k}`, v]);
  for (const [k, v] of Object.entries(data.shadows))
    props.push([`--token-shadow-${k}`, v]);

  // Remove any previously managed props that are no longer in the set
  const nextKeys = new Set(props.map(([k]) => k));
  for (const old of managedProps) {
    if (!nextKeys.has(old)) {
      html.style.removeProperty(old);
      managedProps.delete(old);
    }
  }

  for (const [k, v] of props) {
    const safe = v.replace(/[{}<>]/g, "");
    html.style.setProperty(k, safe);
    managedProps.add(k);
  }
}

function clearTokensFromDOM() {
  const html = document.documentElement;
  for (const k of managedProps) {
    html.style.removeProperty(k);
  }
  managedProps.clear();
}

export function ThemeEditor({
  initial,
  presets,
  activePresetId,
}: {
  initial: ThemeData;
  presets: Preset[];
  activePresetId: string | null;
}) {
  const [groups, setGroups] = useState<ThemeData>(initial);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(activePresetId);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedGroups, setSavedGroups] = useState<ThemeData>(initial);

  const markDirty = useCallback(() => {
    setDirty(true);
    setSaved(false);
  }, []);

  const selectPreset = useCallback(
    (preset: Preset) => {
      const data: ThemeData = {
        colors: { ...preset.colors },
        typography: { ...preset.typography },
        radius: { ...preset.radius },
        shadows: { ...preset.shadows },
      };
      setGroups(data);
      setSelectedPresetId(preset.id);
      markDirty();
      applyTokensToDOM(data);
    },
    [markDirty],
  );

  const updateColor = (key: string, hex: string) => {
    const triplet = hexToRgbTriplet(hex);
    setGroups((s) => {
      const next = { ...s, colors: { ...s.colors, [key]: triplet } };
      applyTokensToDOM(next);
      return next;
    });
    setSelectedPresetId(null);
    markDirty();
  };

  const updateToken = (group: GroupKey, key: string, value: string) => {
    setGroups((s) => {
      const next = { ...s, [group]: { ...s[group], [key]: value } };
      applyTokensToDOM(next);
      return next;
    });
    setSelectedPresetId(null);
    markDirty();
  };

  const addToken = (group: GroupKey) => {
    const key = prompt(`New ${GROUP_LABELS[group]} token name (e.g. primary):`)?.trim().toLowerCase();
    if (!key || !CSS_TOKEN_KEY.test(key) || groups[group][key]) return;
    updateToken(group, key, group === "colors" ? "128 128 128" : "0.5rem");
  };

  const removeToken = (group: GroupKey, key: string) => {
    setGroups((s) => {
      const next = { ...s[group] };
      delete next[key];
      const updated = { ...s, [group]: next };
      applyTokensToDOM(updated);
      return updated;
    });
    setSelectedPresetId(null);
    markDirty();
  };

  const revert = () => {
    setGroups(savedGroups);
    setSelectedPresetId(activePresetId);
    setDirty(false);
    setSaved(false);
    setError(null);
    // Re-apply saved tokens (or remove preview to reveal server style)
    applyTokensToDOM(savedGroups);
  };

  const save = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateThemeAction({ ...groups, presetId: selectedPresetId });
      setSaved(true);
      setDirty(false);
      setSavedGroups(groups);
      // Keep the preview <style> in place — it already shows the correct
      // saved values. No router.refresh() needed. The next hard navigation
      // will pick up the persisted tokens from the DB via layout.tsx.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const pasteJson = () => {
    try {
      const parsed = JSON.parse(pasteText) as Partial<ThemeData>;
      setGroups((s) => {
        const next = {
          colors: { ...s.colors, ...(parsed.colors ?? {}) },
          typography: { ...s.typography, ...(parsed.typography ?? {}) },
          radius: { ...s.radius, ...(parsed.radius ?? {}) },
          shadows: { ...s.shadows, ...(parsed.shadows ?? {}) },
        };
        applyTokensToDOM(next);
        return next;
      });
      setSelectedPresetId(null);
      setPasteOpen(false);
      setPasteText("");
      markDirty();
    } catch {
      setError("That isn't valid JSON.");
    }
  };

  const colorEntries = Object.entries(groups.colors);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        {/* ── Preset themes ── */}
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[var(--color-muted-fg)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
              Theme Presets
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => {
              const isActive = selectedPresetId === preset.id;
              const primaryColor = preset.colors.primary ?? "26 60 52";
              const accentColor = preset.colors.accent ?? "13 122 61";
              const bgColor = preset.colors.bg ?? "255 255 255";
              return (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  className={`group relative flex flex-col gap-2 rounded-[var(--radius-md)] border-2 p-4 text-left transition-all ${
                    isActive
                      ? "border-[rgb(var(--token-primary))] bg-[rgb(var(--token-primary)/0.05)] shadow-sm"
                      : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-muted-fg)] hover:shadow-sm"
                  }`}
                >
                  {isActive && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--token-primary))]">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <div className="flex gap-1.5">
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: `rgb(${primaryColor})` }} />
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: `rgb(${accentColor})` }} />
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: `rgb(${bgColor})` }} />
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--color-muted-fg)]">
            Click a preset for instant preview. Hit <strong>Save theme</strong> to apply globally.
          </p>
        </section>

        {/* ── Color Picker Grid ── */}
        <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
              Colors
            </h2>
            <Button size="sm" variant="outline" onClick={() => addToken("colors")}>
              Add color
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colorEntries.map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
                <label aria-label={`Pick color for ${k}`} className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-sm)] border border-black/15">
                  <input
                    type="color"
                    value={rgbTripletToHex(v)}
                    onChange={(e) => updateColor(k, e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
                    style={{ opacity: 0 }}
                  />
                  <span
                    className="block h-full w-full"
                    style={{ backgroundColor: v ? `rgb(${v})` : "#808080" }}
                  />
                </label>
                <div className="flex flex-1 flex-col">
                  <span className="text-xs font-medium text-[var(--color-fg)]">{k}</span>
                  <span className="font-mono text-[10px] text-[var(--color-muted-fg)]">
                    {rgbTripletToHex(v)}
                  </span>
                </div>
                <button
                  onClick={() => removeToken("colors", k)}
                  className="text-xs text-[var(--color-muted-fg)] transition hover:text-[var(--color-danger)]"
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography, Radius & Shadows ── */}
        {(["typography", "radius", "shadows"] as GroupKey[]).map((group) => {
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
                      <Button size="sm" variant="outline" onClick={() => removeToken(group, k)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        {/* ── Paste JSON ── */}
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
                placeholder='{"colors": {"primary": "26 60 52"}, "radius": {"md": "0.5rem"}}'
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] p-3 font-mono text-xs"
              />
              <Button size="sm" onClick={pasteJson} disabled={!pasteText.trim()}>
                Merge into tokens
              </Button>
            </>
          ) : null}
        </section>
      </div>

      {/* ── Sidebar ── */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          {error ? (
            <p role="alert" className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-danger)/0.10)] p-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-success)/0.10)] p-2 text-sm text-[var(--color-success)]">
              Theme saved and applied globally.
            </p>
          ) : null}
          {dirty && (
            <p className="rounded-[var(--radius-sm)] bg-[rgb(var(--token-primary)/0.08)] p-2 text-xs text-[var(--color-muted-fg)]">
              Previewing unsaved changes.
            </p>
          )}
          <Button onClick={save} disabled={saving || !dirty} className="w-full">
            <Save className="h-4 w-4" /> {saving ? "Saving\u2026" : "Save theme"}
          </Button>
          {dirty && (
            <Button variant="outline" onClick={revert} className="w-full">
              <Undo2 className="h-4 w-4" /> Revert changes
            </Button>
          )}
          <p className="text-xs text-[var(--color-muted-fg)]">
            Pick colors visually. Click <strong>Save theme</strong> to apply for all visitors.
          </p>
        </div>
      </aside>
    </div>
  );
}
