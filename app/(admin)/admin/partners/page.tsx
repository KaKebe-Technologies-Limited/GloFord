import { requireActorFromSession } from "@/lib/auth-context";
import { listPagesByCollection } from "@/lib/services/pages";
import { CuratedPageCollectionTable } from "@/components/admin/CuratedPageCollectionTable";

export const metadata = { title: "Partners" };

export default async function PartnersAdminPage() {
  await requireActorFromSession();
  const rows = await listPagesByCollection("partner");

  return (
    <CuratedPageCollectionTable
      title="Partners"
      description="Manage partner profile pages and partnership details."
      createHref="/admin/partners/new"
      rows={rows}
    />
  );
}
