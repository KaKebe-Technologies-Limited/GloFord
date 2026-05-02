import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { getVersionPair } from "@/lib/services/system";
import { RestoreButton } from "../RestoreButton";

export const metadata = { title: "Version snapshot" };

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireActorFromSession();
  const pair = await getVersionPair(id);
  if (!pair) notFound();

  const { current, previous } = pair;
  const snapshot = current.snapshot as Record<string, unknown> | null;
  const prevSnapshot = previous?.snapshot as Record<string, unknown> | null;
  const diff = current.diff as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/system/versions"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {current.entityType} v{current.version}
            </h1>
            <p className="font-mono text-xs text-[var(--color-muted-fg)]">
              {current.entityId} &middot; {current.createdAt.toLocaleString()}
            </p>
          </div>
        </div>
        <RestoreButton id={current.id} />
      </header>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetaCard label="Entity type" value={current.entityType} />
        <MetaCard label="Version" value={`v${current.version}`} />
        <MetaCard label="Author" value={current.createdById.slice(0, 12)} mono />
        <MetaCard label="Reason" value={current.reason ?? "\u2014"} />
      </div>

      {/* Diff view */}
      {diff ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
            Changes (diff from v{current.version - 1})
          </h2>
          <pre className="mt-3 max-h-96 overflow-auto rounded-[var(--radius-md)] bg-[var(--color-muted)] p-4 font-mono text-xs leading-relaxed">
            {JSON.stringify(diff, null, 2)}
          </pre>
        </section>
      ) : null}

      {/* Side-by-side comparison */}
      {prevSnapshot && snapshot ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
            Side-by-side comparison
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <SnapshotPanel
              label={`v${current.version - 1} (previous)`}
              data={prevSnapshot}
              variant="old"
            />
            <SnapshotPanel
              label={`v${current.version} (current)`}
              data={snapshot}
              variant="new"
            />
          </div>
        </section>
      ) : snapshot ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
            Full snapshot (v{current.version})
          </h2>
          <pre className="mt-3 max-h-[500px] overflow-auto rounded-[var(--radius-md)] bg-[var(--color-muted)] p-4 font-mono text-xs leading-relaxed">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}

function MetaCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-fg)]">{label}</p>
      <p className={`mt-0.5 text-sm ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
    </div>
  );
}

function SnapshotPanel({
  label,
  data,
  variant,
}: {
  label: string;
  data: Record<string, unknown>;
  variant: "old" | "new";
}) {
  const borderColor = variant === "old"
    ? "border-[rgb(var(--token-danger)/0.3)]"
    : "border-[rgb(var(--token-success)/0.3)]";

  return (
    <div className={`rounded-[var(--radius-lg)] border ${borderColor} bg-[var(--color-card)] p-4`}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-fg)]">
        {label}
      </p>
      <pre className="max-h-[400px] overflow-auto rounded-[var(--radius-md)] bg-[var(--color-muted)] p-3 font-mono text-xs leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
