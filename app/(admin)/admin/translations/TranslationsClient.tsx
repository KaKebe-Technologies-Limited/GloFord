"use client";

import { useState, useTransition, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Languages } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import {
  ConfirmDialog,
  ConfirmDialogTrigger,
  ConfirmDialogContent,
  ConfirmDialogHeader,
  ConfirmDialogFooter,
  ConfirmDialogTitle,
  ConfirmDialogDescription,
  ConfirmDialogAction,
  ConfirmDialogCancel,
} from "@/components/ui/ConfirmDialog";
import {
  upsertTranslationAction,
  deleteTranslationAction,
  listTranslationsAction,
} from "./actions";

type Translation = {
  id: string;
  locale: string;
  key: string;
  value: string;
  updatedAt: Date;
};

const LOCALES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Fran\u00e7ais" },
  { code: "sw", label: "Kiswahili" },
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
];

export function TranslationsClient({
  initialTranslations,
}: {
  initialTranslations: Translation[];
}) {
  const [locale, setLocale] = useState("en");
  const [translations, setTranslations] =
    useState<Translation[]>(initialTranslations);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return translations;
    const q = search.toLowerCase();
    return translations.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.value.toLowerCase().includes(q),
    );
  }, [translations, search]);

  function handleLocaleChange(newLocale: string) {
    setLocale(newLocale);
    setError(null);
    startTransition(async () => {
      try {
        const data = await listTranslationsAction(newLocale);
        setTranslations(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load translations");
      }
    });
  }

  function handleAdd() {
    if (!newKey.trim() || !newValue.trim()) return;
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("key", newKey.trim());
    fd.set("value", newValue.trim());
    setError(null);
    startTransition(async () => {
      try {
        await upsertTranslationAction(fd);
        const data = await listTranslationsAction(locale);
        setTranslations(data);
        setNewKey("");
        setNewValue("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleSaveEdit(t: Translation) {
    const fd = new FormData();
    fd.set("locale", t.locale);
    fd.set("key", t.key);
    fd.set("value", editValue);
    setError(null);
    startTransition(async () => {
      try {
        await upsertTranslationAction(fd);
        const data = await listTranslationsAction(locale);
        setTranslations(data);
        setEditingId(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleDelete(t: Translation) {
    const fd = new FormData();
    fd.set("id", t.id);
    fd.set("locale", t.locale);
    setError(null);
    startTransition(async () => {
      try {
        await deleteTranslationAction(fd);
        const data = await listTranslationsAction(locale);
        setTranslations(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[rgb(var(--token-danger)/0.08)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Languages className="h-6 w-6 text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold">Translation Overrides</h1>
      </div>

      {/* Locale selector + search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="locale-select">Locale</Label>
          <Select value={locale} onValueChange={(v) => handleLocaleChange(v)}>
            <SelectTrigger aria-label="locale-select">
              <SelectValue placeholder="Select locale..." />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label} ({l.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
          <Input
            placeholder="Search by key or value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Add new override */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 space-y-3">
        <h2 className="text-sm font-semibold">Add Override</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="new-key">Key</Label>
            <Input
              id="new-key"
              placeholder="e.g. public.home.aboutHeading"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-value">Value</Label>
            <textarea
              id="new-value"
              placeholder="Translation value..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              rows={2}
              className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAdd}
              disabled={isPending || !newKey.trim() || !newValue.trim()}
              size="md"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] divide-y divide-[var(--color-border)]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-muted-fg)]">
            {search
              ? "No overrides match your search."
              : "No translation overrides for this locale yet."}
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="p-4">
              {editingId === t.id ? (
                <div className="space-y-3">
                  <p className="text-xs font-mono text-[var(--color-muted-fg)]">
                    {t.key}
                  </p>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    className="flex w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(t)}
                      disabled={isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-[var(--color-muted-fg)]">
                      {t.key}
                    </p>
                    <p className="mt-0.5 text-sm truncate">{t.value}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(t.id);
                        setEditValue(t.value);
                      }}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDialog>
                      <ConfirmDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                        </Button>
                      </ConfirmDialogTrigger>
                      <ConfirmDialogContent>
                        <ConfirmDialogHeader>
                          <ConfirmDialogTitle>
                            Delete override?
                          </ConfirmDialogTitle>
                          <ConfirmDialogDescription>
                            This will remove the DB override for &quot;{t.key}&quot;. The
                            default JSON value will be used instead.
                          </ConfirmDialogDescription>
                        </ConfirmDialogHeader>
                        <ConfirmDialogFooter>
                          <ConfirmDialogCancel>Cancel</ConfirmDialogCancel>
                          <ConfirmDialogAction
                            onClick={() => handleDelete(t)}
                          >
                            Delete
                          </ConfirmDialogAction>
                        </ConfirmDialogFooter>
                      </ConfirmDialogContent>
                    </ConfirmDialog>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isPending && (
        <div className="text-center text-sm text-[var(--color-muted-fg)]">
          Saving...
        </div>
      )}
    </div>
  );
}
