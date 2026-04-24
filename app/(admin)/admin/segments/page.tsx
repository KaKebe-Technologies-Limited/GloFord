import { requireActorFromSession } from "@/lib/auth-context";
import { listSegments } from "@/lib/services/segments";
import { SegmentCreator } from "./SegmentCreator";
import { SegmentRow } from "./SegmentRow";

export const metadata = { title: "Segments" };

export default async function SegmentsPage() {
  await requireActorFromSession();
  const rows = await listSegments();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Segments</h1>
        <p className="text-sm text-[--color-muted-fg]">
          Audience groups for newsletters and email campaigns. System segments are auto-managed by
          events (e.g. Donors, Youth, Volunteers, Partners).
        </p>
      </header>

      <SegmentCreator />

      <div className="overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-card]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[--color-border] bg-[--color-muted]/50 text-left text-xs uppercase tracking-wider text-[--color-muted-fg]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[--color-muted-fg]">
                    No segments yet.
                  </td>
                </tr>
              ) : (
                rows.map((s) => <SegmentRow key={s.id} segment={s} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
