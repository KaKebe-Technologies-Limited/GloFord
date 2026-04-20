import { requireActorFromSession } from "@/lib/auth-context";
import { ProgramForm } from "../ProgramForm";

export const metadata = { title: "New program" };

export default async function NewProgram() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New program</h1>
      </header>
      <ProgramForm />
    </div>
  );
}
