import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Monitor, Clock } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { getAuditLogDetail } from "@/lib/services/system";

export const metadata = { title: "Audit detail" };

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireActorFromSession();
  const row = await getAuditLogDetail(id);
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link
          href="/admin/system/audit"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit event</h1>
          <p className="font-mono text-xs text-[var(--color-muted-fg)]">{row.id}</p>
        </div>
      </header>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Action" value={row.action} />
        <InfoCard label="Module" value={row.module} />
        <InfoCard label="Entity" value={row.entityType ? `${row.entityType}#${row.entityId?.slice(0, 8) ?? ""}` : "\u2014"} />
        <InfoCard label="User" value={row.userId?.slice(0, 12) ?? "system"} mono />
        <InfoCard label="Timestamp" value={row.createdAt.toLocaleString()} icon={<Clock className="h-3.5 w-3.5" />} />
        <InfoCard label="Correlation ID" value={row.correlationId ?? "\u2014"} mono />
      </div>

      {/* Context */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
            <Globe className="h-3.5 w-3.5" /> Location &amp; Network
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="IP address" value={row.ipAddress ?? "\u2014"} />
            <Row label="Country" value={row.geoCountry ?? "\u2014"} />
            <Row label="City" value={row.geoCity ?? "\u2014"} />
          </dl>
        </section>
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
            <Monitor className="h-3.5 w-3.5" /> Device
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Device type" value={row.deviceType ?? "\u2014"} />
            <Row label="OS" value={row.os ?? "\u2014"} />
            <Row label="Browser" value={row.browser ?? "\u2014"} />
            <Row label="User-Agent" value={row.userAgent ?? "\u2014"} truncate />
          </dl>
        </section>
      </div>

      {/* Diff */}
      {row.diff ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
            Change diff
          </h2>
          <pre className="mt-3 max-h-96 overflow-auto rounded-[var(--radius-md)] bg-[var(--color-muted)] p-4 font-mono text-xs leading-relaxed">
            {typeof row.diff === "string" ? row.diff : JSON.stringify(row.diff, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}

function InfoCard({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">
        {icon} {label}
      </p>
      <p className={`mt-1 text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Row({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--color-muted-fg)]">{label}</dt>
      <dd className={`text-right font-mono text-xs ${truncate ? "max-w-[200px] truncate" : ""}`} title={value}>
        {value}
      </dd>
    </div>
  );
}
