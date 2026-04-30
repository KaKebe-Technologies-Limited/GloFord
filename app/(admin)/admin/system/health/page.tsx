import { Activity, Database, Mail, Zap } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { db } from "@/lib/db";

export const metadata = { title: "System health" };

async function dbPing() {
  const t = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, ms: Date.now() - t };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function envFlag(name: string) {
  const v = process.env[name];
  return { set: !!v, preview: v ? `${v.slice(0, 6)}…` : null };
}

export default async function HealthPage() {
  await requireActorFromSession();
  const [database] = await Promise.all([dbPing()]);

  const inngest = {
    eventKey: envFlag("INNGEST_EVENT_KEY"),
    signingKey: envFlag("INNGEST_SIGNING_KEY"),
    baseUrl: process.env.INNGEST_BASE_URL ?? "unset",
  };
  const mail = {
    resendKey: envFlag("RESEND_API_KEY"),
    from: process.env.MAIL_FROM ?? "unset",
  };
  const app = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "unset",
    encryptionKey: envFlag("ENCRYPTION_KEY"),
    authSecret: envFlag("AUTH_SECRET"),
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">System health</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Real-time checks of the services this installation depends on.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card icon={Database} title="Database">
          <Dot ok={database.ok} />
          {database.ok ? (
            <>
              <span className="font-medium">Connected</span>
              <span className="ml-auto text-xs text-[var(--color-muted-fg)]">{database.ms}ms</span>
            </>
          ) : (
            <>
              <span className="font-medium text-[var(--color-danger)]">Unreachable</span>
              <span className="ml-auto text-xs text-[var(--color-muted-fg)]">
                {"error" in database && database.error ? database.error.slice(0, 48) : ""}
              </span>
            </>
          )}
        </Card>

        <Card icon={Zap} title="Inngest">
          <Dot ok={inngest.eventKey.set || inngest.baseUrl.startsWith("http")} />
          <span className="font-medium">
            {inngest.baseUrl.startsWith("http") ? "Dev server" : inngest.eventKey.set ? "Cloud" : "Unconfigured"}
          </span>
          <span className="ml-auto text-xs text-[var(--color-muted-fg)]">{inngest.baseUrl}</span>
        </Card>

        <Card icon={Mail} title="Mail provider">
          <Dot ok={mail.resendKey.set} />
          <span className="font-medium">
            {mail.resendKey.set ? "Resend configured" : "Dry-run mode"}
          </span>
          <span className="ml-auto text-xs text-[var(--color-muted-fg)]">{mail.from}</span>
        </Card>

        <Card icon={Activity} title="App">
          <Dot ok={app.encryptionKey.set && app.authSecret.set} />
          <span className="font-medium">{app.nodeEnv}</span>
          <span className="ml-auto text-xs text-[var(--color-muted-fg)]">{app.appUrl}</span>
        </Card>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
          Required secrets
        </h2>
        <ul className="space-y-2 text-sm">
          <Secret name="ENCRYPTION_KEY" ok={app.encryptionKey.set} />
          <Secret name="AUTH_SECRET" ok={app.authSecret.set} />
          <Secret name="INNGEST_SIGNING_KEY" ok={inngest.signingKey.set} optional />
          <Secret name="INNGEST_EVENT_KEY" ok={inngest.eventKey.set} optional />
          <Secret name="RESEND_API_KEY" ok={mail.resendKey.set} optional />
        </ul>
      </section>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {title}
      </div>
      <div className="flex items-center gap-2 text-sm">{children}</div>
    </div>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        "inline-block h-2.5 w-2.5 rounded-full " +
        (ok ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]")
      }
      aria-hidden="true"
    />
  );
}

function Secret({ name, ok, optional }: { name: string; ok: boolean; optional?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <Dot ok={ok} />
      <code className="text-xs">{name}</code>
      <span className="ml-auto text-xs text-[var(--color-muted-fg)]">
        {ok ? "configured" : optional ? "optional — unset" : "MISSING"}
      </span>
    </li>
  );
}
