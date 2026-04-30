import { requireActorFromSession } from "@/lib/auth-context";
import { PageForm } from "@/app/(admin)/admin/pages/PageForm";

export const metadata = { title: "New Team Member" };

export default async function NewTeamMemberPage() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New team member</h1>
      </header>
      <PageForm
        initial={{
          title: "New team member",
          slug: "leadership-new-member",
          seoTitle: "New team member",
          seoDesc: "Leadership team profile.",
        }}
      />
    </div>
  );
}
