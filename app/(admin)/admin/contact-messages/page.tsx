import { requireActorFromSession } from "@/lib/auth-context";
import { getAllContactMessages } from "@/lib/services/contact";
import { Pagination } from "@/components/admin/Pagination";
import { ContactMessagesClient } from "./ContactMessagesClient";

export const metadata = { title: "Contact Messages" };

export default async function ContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireActorFromSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, totalPages } = await getAllContactMessages({ page, perPage: 50 });

  return (
    <div className="space-y-6">
      <ContactMessagesClient messages={rows} />
      <Pagination page={page} totalPages={totalPages} total={total} basePath="/admin/contact-messages" />
    </div>
  );
}
