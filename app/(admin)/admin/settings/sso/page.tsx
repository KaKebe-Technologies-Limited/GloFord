import { Shield, KeyRound } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";

export const metadata = { title: "SSO providers" };

type ProviderState = {
  id: string;
  label: string;
  configured: boolean;
  env: { name: string; set: boolean }[];
  docsUrl: string;
};

function check(name: string): boolean {
  return !!process.env[name];
}

export default async function SsoPage() {
  await requireActorFromSession();

  const providers: ProviderState[] = [
    {
      id: "credentials",
      label: "Email + password",
      configured: check("AUTH_SECRET"),
      env: [{ name: "AUTH_SECRET", set: check("AUTH_SECRET") }],
      docsUrl: "https://authjs.dev/getting-started/providers/credentials",
    },
    {
      id: "google",
      label: "Google",
      configured: check("AUTH_GOOGLE_ID") && check("AUTH_GOOGLE_SECRET"),
      env: [
        { name: "AUTH_GOOGLE_ID", set: check("AUTH_GOOGLE_ID") },
        { name: "AUTH_GOOGLE_SECRET", set: check("AUTH_GOOGLE_SECRET") },
      ],
      docsUrl: "https://authjs.dev/getting-started/providers/google",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">SSO providers</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Identity providers wired through Auth.js. Toggle a provider by setting its secrets in the
          runtime environment — changes take effect on next app boot.
        </p>
      </header>

      <ul className="space-y-3">
        {providers.map((p) => (
          <li
            key={p.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
          >
            <div className="flex items-center gap-3">
              <Shield
                className={
                  p.configured
                    ? "h-5 w-5 text-[var(--color-success)]"
                    : "h-5 w-5 text-[var(--color-muted-fg)]"
                }
                aria-hidden="true"
              />
              <div className="flex-1">
                <h2 className="font-semibold">{p.label}</h2>
                <p className="text-xs text-[var(--color-muted-fg)]">
                  {p.configured
                    ? "Configured and available on the sign-in page."
                    : "Not configured — sign-in option hidden."}
                </p>
              </div>
              <a
                href={p.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--color-primary)] hover:underline"
              >
                Docs →
              </a>
            </div>
            <ul className="mt-3 space-y-1 pl-8">
              {p.env.map((v) => (
                <li key={v.name} className="flex items-center gap-2 text-xs">
                  <KeyRound
                    className={
                      v.set
                        ? "h-3.5 w-3.5 text-[var(--color-success)]"
                        : "h-3.5 w-3.5 text-[var(--color-danger)]"
                    }
                    aria-hidden="true"
                  />
                  <code>{v.name}</code>
                  <span className="text-[var(--color-muted-fg)]">
                    {v.set ? "set" : "missing"}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] p-3 text-xs text-[var(--color-muted-fg)]">
        Adding a new provider (GitHub, Microsoft, etc.): add it to <code>lib/auth.ts</code>,
        set the matching <code>AUTH_*</code> env vars, and redeploy. Providers are registered at
        app boot from the environment, not from the database.
      </p>
    </div>
  );
}
