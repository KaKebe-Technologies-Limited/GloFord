import { requireActorFromSession } from "@/lib/auth-context";
import { listSegments } from "@/lib/services/segments";
import { NewsletterForm } from "../NewsletterForm";

export const metadata = { title: "New newsletter" };

export default async function NewNewsletter() {
  const actor = await requireActorFromSession();
  const segments = await listSegments(actor.orgId);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New newsletter</h1>
      </header>
      <NewsletterForm segments={segments.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))} />
    </div>
  );
}
