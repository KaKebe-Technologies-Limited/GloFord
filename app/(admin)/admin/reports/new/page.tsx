import { requireActorFromSession } from "@/lib/auth-context";
import { PageForm } from "@/app/(admin)/admin/pages/PageForm";

export const metadata = { title: "New Report" };

export default async function NewReportPage() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New report</h1>
      </header>
      <PageForm
        initial={{
          title: "New report",
          slug: "report-2026-annual-accountability",
          seoTitle: "New report",
          seoDesc: "Annual accountability and reporting page.",
        }}
      />
    </div>
  );
}
