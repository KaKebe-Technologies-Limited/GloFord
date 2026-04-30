import { requireActorFromSession } from "@/lib/auth-context";
import { listPagesByCollection } from "@/lib/services/pages";
import { CuratedPageCollectionTable } from "@/components/admin/CuratedPageCollectionTable";

export const metadata = { title: "Impact Stories" };

export default async function ImpactStoriesAdminPage() {
  await requireActorFromSession();
  const rows = await listPagesByCollection("impactStory");

  return (
    <CuratedPageCollectionTable
      title="Impact Stories"
      description="Success stories published separately from the blog."
      createHref="/admin/impact-stories/new"
      rows={rows}
    />
  );
}
