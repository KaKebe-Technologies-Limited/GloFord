import { requireActorFromSession } from "@/lib/auth-context";
import { getAllFaqs } from "@/lib/services/faqs";
import { FaqsClient } from "./FaqsClient";

export const metadata = { title: "FAQs" };

export default async function FaqsAdminPage() {
  await requireActorFromSession();
  const faqs = await getAllFaqs();
  return <FaqsClient faqs={faqs} />;
}
