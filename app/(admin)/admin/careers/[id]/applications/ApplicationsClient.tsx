"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateApplicationStatusAction } from "../../actions";

const STATUS_OPTIONS = [
  "SUBMITTED",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
] as const;

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  REVIEWING: "bg-amber-100 text-amber-700",
  SHORTLISTED: "bg-purple-100 text-purple-700",
  INTERVIEW: "bg-indigo-100 text-indigo-700",
  OFFERED: "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]",
  REJECTED: "bg-[rgb(var(--token-danger)/0.20)] text-[var(--color-danger)]",
  WITHDRAWN: "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
};

type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  coverLetter: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  status: string;
  notes: string | null;
  createdAt: Date | string;
};

export function ApplicationsClient({
  career,
  applications,
}: {
  career: { id: string; title: string };
  applications: Application[];
}) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const router = useRouter();

  const viewing = applications.find((a) => a.id === viewingId);

  async function handleStatusChange(formData: FormData) {
    await updateApplicationStatusAction(formData);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          href="/admin/careers"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Careers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Applications for &quot;{career.title}&quot;
        </h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          {applications.length} application{applications.length !== 1 ? "s" : ""}{" "}
          received.
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
            {viewing.linkedinUrl && (
              <div>
                <dt className="font-medium text-[var(--color-muted-fg)]">LinkedIn</dt>
                <dd>
                  <a
                    href={viewing.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    {viewing.linkedinUrl}
                  </a>
                </dd>
              </div>
            )}
            {viewing.resumeUrl && (
              <div>
                <dt className="font-medium text-[var(--color-muted-fg)]">Resume</dt>
                <dd>
                  <a
                    href={viewing.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    View Resume
                  </a>
                </dd>
              </div>
            )}
            {viewing.coverLetter && (
              <div className="sm:col-span-2">
                <dt className="font-medium text-[var(--color-muted-fg)]">
                  Cover Letter
                </dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-[var(--radius-md)] bg-[rgb(var(--token-muted)/0.50)] p-3 text-sm">
                  {viewing.coverLetter}
                </dd>
              </div>
            )}
            {viewing.notes && (
              <div className="sm:col-span-2">
                <dt className="font-medium text-[var(--color-muted-fg)]">
                  Internal Notes
                </dt>
                <dd className="mt-1 whitespace-pre-wrap">{viewing.notes}</dd>
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
                      <form action={handleStatusChange} className="inline-flex">
                        <input type="hidden" name="id" value={app.id} />
                        <div className="relative">
                          <select
                            name="status"
                            defaultValue={app.status}
                            onChange={(e) => {
                              const form = e.target.closest("form");
                              if (form) form.requestSubmit();
                            }}
                            className={`appearance-none rounded-full py-0.5 pl-2.5 pr-7 text-xs font-medium ${STATUS_STYLES[app.status] ?? "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0) + s.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2" />
                        </div>
                      </form>
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
