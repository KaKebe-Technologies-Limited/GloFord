import { requireActorFromSession } from "@/lib/auth-context";
import { listPagesByCollection } from "@/lib/services/pages";
import { CuratedPageCollectionTable } from "@/components/admin/CuratedPageCollectionTable";

export const metadata = { title: "Leadership Team" };

export default async function TeamAdminPage() {
  await requireActorFromSession();
  const rows = await listPagesByCollection("team");

  return (
    <CuratedPageCollectionTable
      title="Leadership Team"
      description="Manage team member profiles and leadership detail pages."
      createHref="/admin/team/new"
      rows={rows}
    />
  );
}
