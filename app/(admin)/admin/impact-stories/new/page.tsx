import { requireActorFromSession } from "@/lib/auth-context";
import { PageForm } from "@/app/(admin)/admin/pages/PageForm";

export const metadata = { title: "New Impact Story" };

export default async function NewImpactStoryPage() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New impact story</h1>
      </header>
      <PageForm
        initial={{
          title: "New impact story",
          slug: "impact-story-new-story",
          seoTitle: "New impact story",
          seoDesc: "A success story from the field.",
        }}
      />
    </div>
  );
}
