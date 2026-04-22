"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateSiteSettingsAction } from "@/lib/actions/settings";
import { Button } from "@/components/ui/Button";

type Initial = {
  siteName: string;
  logoUrl: string;
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
            />
          </Field>
          <Field label="Logo URL">
            <input
              value={state.logoUrl}
              onChange={(e) => setState((s) => ({ ...s, logoUrl: e.target.value }))}
              className={inputCls}
              placeholder="https://…"
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
          <Field label="Open Graph image URL">
            <input
              value={state.seo.ogImageUrl}
              onChange={(e) =>
                setState((s) => ({ ...s, seo: { ...s.seo, ogImageUrl: e.target.value } }))
              }
              className={inputCls}
              placeholder="https://…"
            />
          </Field>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-3 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5">
          {error ? (
            <p
              role="alert"
              className="rounded-[--radius-sm] bg-[--color-danger]/10 p-2 text-sm text-[--color-danger]"
            >
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="rounded-[--radius-sm] bg-[--color-success]/10 p-2 text-sm text-[--color-success]">
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
    <section className="space-y-3 rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[--color-muted-fg]">
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
  "w-full rounded-[--radius-md] border border-[--color-input] bg-[--color-bg] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-ring]";
