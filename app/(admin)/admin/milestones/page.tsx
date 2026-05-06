import { requireActorFromSession } from "@/lib/auth-context";
import { listMilestones } from "@/lib/services/milestones";
import { MilestonesClient } from "./MilestonesClient";

export const metadata = { title: "Milestones" };

export default async function MilestonesAdminPage() {
  await requireActorFromSession();
  const milestones = await listMilestones();
  return <MilestonesClient milestones={milestones} />;
}
