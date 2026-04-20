import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPublishedProgramBySlug } from "@/lib/services/programs";

async function resolveOrg() {
  return db.organization.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const org = await resolveOrg();
  if (!org) return {};
  try {
    const p = await getPublishedProgramBySlug(org.id, slug);
    return { title: p.title, description: p.summary };
  } catch {
    return {};
  }
}

export default async function ProgramDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await resolveOrg();
  if (!org) notFound();

  let program;
  try {
    program = await getPublishedProgramBySlug(org.id, slug);
  } catch {
    notFound();
  }

  return (
    <article>
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{program.title}</h1>
        <p className="mt-4 text-lg text-[--color-muted-fg]">{program.summary}</p>
      </section>
      <BlockRenderer blocks={program.body} orgId={org.id} />
    </article>
  );
}
