import { requireActorFromSession } from "@/lib/auth-context";
import { getAllPartnerApplications } from "@/lib/services/partnerApplications";
import { PartnerApplicationsClient } from "./PartnerApplicationsClient";

export const metadata = { title: "Partner Applications" };

export default async function PartnerApplicationsAdminPage() {
  await requireActorFromSession();
  const applications = await getAllPartnerApplications();
  return <PartnerApplicationsClient applications={applications} />;
}
