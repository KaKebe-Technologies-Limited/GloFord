import { notFound } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { getNewsletterForEdit } from "@/lib/services/newsletters";
import { listSegments } from "@/lib/services/segments";
import { NewsletterForm } from "../NewsletterForm";
import { NewsletterStatusBadge } from "../StatusBadge";

export default async function EditNewsletter({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireActorFromSession();
  const [nl, segments] = await Promise.all([
    getNewsletterForEdit(id),
    listSegments(),
  ]);
  if (!nl) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{nl.title}</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">{nl.subject}</p>
        </div>
        <NewsletterStatusBadge status={nl.status} />
      </header>
      <NewsletterForm
        segments={segments.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
        initial={{
          id: nl.id,
          title: nl.title,
          subject: nl.subject,
          preheader: nl.preheader ?? undefined,
          content: (nl.content as never) ?? [],
          segmentIds: nl.segmentIds,
          status: nl.status,
          scheduledAt: nl.scheduledAt ? nl.scheduledAt.toISOString().slice(0, 16) : "",
        }}
      />
    </div>
  );
}
