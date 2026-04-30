import { notFound } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { getProgramForEdit } from "@/lib/services/programs";
import { ProgramForm } from "../ProgramForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProgramStatusControl } from "../ProgramStatusControl";

export default async function EditProgram({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireActorFromSession();
  const program = await getProgramForEdit(id);
  if (!program) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{program.title}</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">/programs/{program.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={program.status} />
          <ProgramStatusControl id={program.id} status={program.status} />
        </div>
      </header>
      <ProgramForm
        initial={{
          id: program.id,
          slug: program.slug,
          title: program.title,
          summary: program.summary,
          body: (program.body as never) ?? [],
          coverMediaId: program.coverMediaId ?? undefined,
          coverUrl: program.cover?.url ?? null,
          order: program.order,
        }}
      />
    </div>
  );
}
