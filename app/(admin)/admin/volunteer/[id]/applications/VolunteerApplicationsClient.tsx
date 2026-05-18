"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { updateVolunteerApplicationStatusAction } from "../../actions";

const STATUS_OPTIONS = ["SUBMITTED", "APPROVED", "REJECTED"] as const;

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]",
  REJECTED: "bg-[rgb(var(--token-danger)/0.20)] text-[var(--color-danger)]",
};

type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  motivation: string | null;
  availability: string | null;
  skills: unknown;
  status: string;
  createdAt: Date | string;
};

export function VolunteerApplicationsClient({
  opportunity,
  applications,
}: {
  opportunity: { id: string; title: string };
  applications: Application[];
}) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const router = useRouter();

  const viewing = applications.find((a) => a.id === viewingId);

  async function handleStatusChange(formData: FormData) {
    await updateVolunteerApplicationStatusAction(formData);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          href="/admin/volunteer"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Volunteer
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Applications for &quot;{opportunity.title}&quot;
        </h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          {applications.length} application
          {applications.length !== 1 ? "s" : ""} received.
        </p>
      </header>

      {/* Detail panel */}
      {viewing && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {viewing.firstName} {viewing.lastName}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewingId(null)}
            >
              Close
            </Button>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-[var(--color-muted-fg)]">Email</dt>
              <dd>{viewing.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-muted-fg)]">Phone</dt>
              <dd>{viewing.phone ?? "-"}</dd>
            </div>
            {viewing.availability && (
              <div>
                <dt className="font-medium text-[var(--color-muted-fg)]">
                  Availability
                </dt>
                <dd className="capitalize">{viewing.availability}</dd>
              </div>
            )}
            {Array.isArray(viewing.skills) &&
              (viewing.skills as string[]).length > 0 && (
                <div>
                  <dt className="font-medium text-[var(--color-muted-fg)]">
                    Skills
                  </dt>
                  <dd>{(viewing.skills as string[]).join(", ")}</dd>
                </div>
              )}
            {viewing.motivation && (
              <div className="sm:col-span-2">
                <dt className="font-medium text-[var(--color-muted-fg)]">
                  Motivation
                </dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-[var(--radius-md)] bg-[rgb(var(--token-muted)/0.50)] p-3 text-sm">
                  {viewing.motivation}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[rgb(var(--token-muted)/0.50)] text-left text-xs uppercase tracking-wider text-[var(--color-muted-fg)]">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    No applications received yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    className="group hover:bg-[rgb(var(--token-muted)/0.50)]"
                  >
                    <td className="px-4 py-3 font-medium">
                      {app.firstName} {app.lastName}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {app.email}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect
                        appId={app.id}
                        defaultStatus={app.status}
                        onSubmit={handleStatusChange}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingId(app.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusSelect({
  appId,
  defaultStatus,
  onSubmit,
}: {
  appId: string;
  defaultStatus: string;
  onSubmit: (formData: FormData) => void;
}) {
  const [status, setStatus] = useState(defaultStatus);
  const formRef = React.useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={onSubmit} className="inline-flex">
      <input type="hidden" name="id" value={appId} />
      <input type="hidden" name="status" value={status} />
      <Select
        value={status}
        onValueChange={(v) => {
          setStatus(v);
          setTimeout(() => formRef.current?.requestSubmit(), 0);
        }}
      >
        <SelectTrigger
          className={`rounded-full py-0.5 pl-2.5 pr-7 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
