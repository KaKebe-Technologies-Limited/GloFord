import { requireActorFromSession } from "@/lib/auth-context";
import { PageForm } from "@/app/(admin)/admin/pages/PageForm";

export const metadata = { title: "New Press Release" };

export default async function NewPressPage() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New press release</h1>
      </header>
      <PageForm
        initial={{
          title: "New press release",
          slug: "press-new-release",
          seoTitle: "New press release",
          seoDesc: "A press release from Gloford.",
        }}
      />
    </div>
  );
}
