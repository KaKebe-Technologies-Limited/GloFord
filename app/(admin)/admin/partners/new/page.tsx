import { requireActorFromSession } from "@/lib/auth-context";
import { PageForm } from "@/app/(admin)/admin/pages/PageForm";

export const metadata = { title: "New Partner" };

export default async function NewPartnerPage() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New partner</h1>
      </header>
      <PageForm
        initial={{
          title: "New partner",
          slug: "partner-new-partner",
          seoTitle: "New partner",
          seoDesc: "Partnership overview and collaboration details.",
        }}
      />
    </div>
  );
}
