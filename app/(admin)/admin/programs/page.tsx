import Link from "next/link";
import { Plus } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listPrograms } from "@/lib/services/programs";
import { Button } from "@/components/ui/Button";
import { ProgramListClient } from "./ProgramListClient";
import type { Program } from "@prisma/client";

export const metadata = { title: "Programs" };

export default async function ProgramsListPage() {
  await requireActorFromSession();
  const rows = await listPrograms();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Programs</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">The initiatives your organization runs.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/programs/new">
            <Plus className="h-4 w-4" /> New program
          </Link>
        </Button>
      </header>

      <ProgramListClient data={rows as Program[]} />
    </div>
  );
}
