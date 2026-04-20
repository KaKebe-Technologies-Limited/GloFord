import { requireActorFromSession } from "@/lib/auth-context";
import { PageForm } from "../PageForm";

export const metadata = { title: "New page" };

export default async function NewPage() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New page</h1>
      </header>
      <PageForm />
    </div>
  );
}
