import Link from "next/link";
import { db } from "@/lib/db";
import { listPublishedPrograms } from "@/lib/services/programs";

export const metadata = { title: "Programs" };

export default async function ProgramsIndex() {
  const org = await db.organization.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!org) return null;
  const programs = await listPublishedPrograms(org.id);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <header className="mb-10 space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Our programs</h1>
        <p className="text-[--color-muted-fg]">Initiatives we run with community partners.</p>
      </header>
      {programs.length === 0 ? (
        <p className="text-[--color-muted-fg]">Programs will appear here once published.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <li key={p.id}>
              <Link
                href={`/programs/${p.slug}`}
                className="block rounded-[--radius-lg] border border-[--color-border] bg-[--color-card] p-6 transition hover:shadow-sm"
              >
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-[--color-muted-fg]">{p.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
