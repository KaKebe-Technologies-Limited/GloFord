import { notFound } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { getPageForEdit } from "@/lib/services/pages";
import { PageForm } from "../PageForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PublishControls } from "../PublishControls";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActorFromSession();
  const page = await getPageForEdit(actor.orgId, id);
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
          <p className="text-sm text-[--color-muted-fg]">/{page.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={page.status} />
          <PublishControls id={page.id} status={page.status} />
        </div>
      </header>
      <PageForm
        initial={{
          id: page.id,
          slug: page.slug,
          title: page.title,
          seoTitle: page.seoTitle ?? undefined,
          seoDesc: page.seoDesc ?? undefined,
          blocks: (page.blocks as never) ?? [],
        }}
      />
    </div>
  );
}
