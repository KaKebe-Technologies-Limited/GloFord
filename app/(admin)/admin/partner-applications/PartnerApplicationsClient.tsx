"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, ChevronDown, Handshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updatePartnerApplicationStatusAction } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
  APPROVED: "bg-[rgb(var(--token-success)/0.20)] text-[var(--color-success)]",
  REJECTED: "bg-[rgb(var(--token-danger)/0.20)] text-[var(--color-danger)]",
};

type PartnerApplication = {
  id: string;
  organizationName: string;
  contactName: string;
  email: string;
  phone: string | null;
  website: string | null;
  description: string;
  partnershipType: string;
  message: string | null;
  status: string;
  createdAt: Date | string;
};

export function PartnerApplicationsClient({
  applications,
}: {
  applications: PartnerApplication[];
}) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const router = useRouter();

  const viewing = applications.find((a) => a.id === viewingId);

  async function handleStatusChange(formData: FormData) {
    await updatePartnerApplicationStatusAction(formData);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Partner Applications
        </h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Review and manage partnership requests.
        </p>
      </header>

      {/* Detail panel */}
      {viewing && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {viewing.organizationName}
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
              <dt className="font-medium text-[var(--color-muted-fg)]">
                Contact Name
              </dt>
              <dd>{viewing.contactName}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-muted-fg)]">Email</dt>
              <dd>
                <a
                  href={`mailto:${viewing.email}`}
                  className="text-[var(--color-primary)] hover:underline"
                >
                  {viewing.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-muted-fg)]">Phone</dt>
              <dd>{viewing.phone ?? "-"}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-muted-fg)]">
                Partnership Type
              </dt>
              <dd>{viewing.partnershipType}</dd>
            </div>
            {viewing.website && (
              <div>
                <dt className="font-medium text-[var(--color-muted-fg)]">Website</dt>
                <dd>
                  <a
                    href={viewing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    {viewing.website}
                  </a>
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="font-medium text-[var(--color-muted-fg)]">
                Description
              </dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-[var(--radius-md)] bg-[rgb(var(--token-muted)/0.50)] p-3">
                {viewing.description}
              </dd>
            </div>
            {viewing.message && (
              <div className="sm:col-span-2">
                <dt className="font-medium text-[var(--color-muted-fg)]">Message</dt>
                <dd className="mt-1 whitespace-pre-wrap">{viewing.message}</dd>
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
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[var(--color-muted-fg)]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Handshake className="h-8 w-8" />
                      No partner applications received yet.
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    className="group hover:bg-[rgb(var(--token-muted)/0.50)]"
                  >
                    <td className="px-4 py-3 font-medium">
                      {app.organizationName}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {app.contactName}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {app.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-medium">
                        {app.partnershipType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={handleStatusChange}
                        className="inline-flex"
                      >
                        <input type="hidden" name="id" value={app.id} />
                        <StatusSelect defaultStatus={app.status} />
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

function StatusSelect({ defaultStatus }: { defaultStatus: string }) {
  const [status, setStatus] = useState(defaultStatus);
  return (
    <div className="relative">
      <select
        name="status"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          const form = e.target.closest("form");
          if (form) form.requestSubmit();
        }}
        className={`appearance-none rounded-full py-0.5 pl-2.5 pr-7 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"}`}
      >
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2" />
    </div>
  );
}
