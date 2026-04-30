"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateSiteSettingsAction } from "@/lib/actions/settings";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/ui/ImagePicker";

type Initial = {
  siteName: string;
  logoUrl: string;
  loginBgUrl: string;
  donationsEnabled: boolean;
  campaignsEnabled: boolean;
  contact: { email: string; phone: string; address: string };
  socials: {
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  seo: { defaultTitle: string; defaultDescription: string; ogImageUrl: string };
};

export function SiteSettingsForm({ initial }: { initial: Initial }) {
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const save = () => {
    setError(null);
    setSaved(false);
    start(async () => {
      try {
        await updateSiteSettingsAction({
          siteName: state.siteName,
          logoUrl: state.logoUrl || null,
          loginBgUrl: state.loginBgUrl || null,
          donationsEnabled: state.donationsEnabled,
          campaignsEnabled: state.campaignsEnabled,
          contact: state.contact,
          socials: state.socials,
          seo: state.seo,
        });
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <Card title="Brand">
          <Field label="Site name">
            <input
              value={state.siteName}
              onChange={(e) => setState((s) => ({ ...s, siteName: e.target.value }))}
              className={inputCls}
              placeholder="Your site name"
            />
          </Field>
          <Field label="Logo">
            <ImagePicker
              value={state.logoUrl}
              onChange={(url) => setState((s) => ({ ...s, logoUrl: url ?? "" }))}
              placeholder="Logo"
              aspect="3/1"
            />
          </Field>
          <Field label="Login page background">
            <ImagePicker
              value={state.loginBgUrl}
              onChange={(url) => setState((s) => ({ ...s, loginBgUrl: url ?? "" }))}
              placeholder="Login background"
              aspect="16/9"
            />
          </Field>
        </Card>

        <Card title="Contact">
          <Field label="Public email">
            <input
              type="email"
              value={state.contact.email}
              onChange={(e) =>
                setState((s) => ({ ...s, contact: { ...s.contact, email: e.target.value } }))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              value={state.contact.phone}
              onChange={(e) =>
                setState((s) => ({ ...s, contact: { ...s.contact, phone: e.target.value } }))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Address">
            <textarea
              value={state.contact.address}
              onChange={(e) =>
                setState((s) => ({ ...s, contact: { ...s.contact, address: e.target.value } }))
              }
              rows={3}
              className={inputCls}
            />
          </Field>
        </Card>

        <Card title="Socials">
          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                ["twitter", "Twitter / X"],
                ["facebook", "Facebook"],
                ["instagram", "Instagram"],
                ["linkedin", "LinkedIn"],
                ["youtube", "YouTube"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  value={state.socials[key]}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      socials: { ...s.socials, [key]: e.target.value },
                    }))
                  }
                  className={inputCls}
                  placeholder="https://…"
                />
              </Field>
            ))}
          </div>
        </Card>

        <Card title="Features">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p id="donations-label" className="text-sm font-medium">Donations</p>
                <p className="text-xs text-[var(--color-muted-fg)]">
                  Show the public donate page and accept donations
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state.donationsEnabled}
                aria-labelledby="donations-label"
                onClick={() => setState((s) => ({ ...s, donationsEnabled: !s.donationsEnabled }))}
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  state.donationsEnabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-muted)]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-[var(--color-bg)] shadow transition ${
                    state.donationsEnabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p id="campaigns-label" className="text-sm font-medium">Campaigns</p>
                <p className="text-xs text-[var(--color-muted-fg)]">
                  Allow creating fundraising campaigns with goals and progress tracking
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state.campaignsEnabled}
                aria-labelledby="campaigns-label"
                onClick={() => setState((s) => ({ ...s, campaignsEnabled: !s.campaignsEnabled }))}
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  state.campaignsEnabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-muted)]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-[var(--color-bg)] shadow transition ${
                    state.campaignsEnabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </Card>

        <Card title="SEO defaults">
          <Field label="Default title">
            <input
              value={state.seo.defaultTitle}
              onChange={(e) =>
                setState((s) => ({ ...s, seo: { ...s.seo, defaultTitle: e.target.value } }))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Default description">
            <textarea
              value={state.seo.defaultDescription}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  seo: { ...s.seo, defaultDescription: e.target.value },
                }))
              }
              rows={3}
              className={inputCls}
            />
          </Field>
          <Field label="Open Graph image">
            <ImagePicker
              value={state.seo.ogImageUrl}
              onChange={(url) =>
                setState((s) => ({ ...s, seo: { ...s.seo, ogImageUrl: url ?? "" } }))
              }
              placeholder="OG image (1200×630)"
              aspect="1200/630"
            />
          </Field>
        </Card>
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
              Settings saved.
            </p>
          ) : null}
          <Button onClick={save} disabled={pending} className="w-full">
            <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-input)] bg-[var(--color-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]";
