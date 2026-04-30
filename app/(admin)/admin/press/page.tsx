import { requireActorFromSession } from "@/lib/auth-context";
import { listPagesByCollection } from "@/lib/services/pages";
import { CuratedPageCollectionTable } from "@/components/admin/CuratedPageCollectionTable";

export const metadata = { title: "Press & Media" };

export default async function PressAdminPage() {
  await requireActorFromSession();
  const rows = await listPagesByCollection("press");

  return (
    <CuratedPageCollectionTable
      title="Press & Media"
      description="Press releases, media mentions, and organizational updates."
      createHref="/admin/press/new"
      rows={rows}
    />
  );
}
