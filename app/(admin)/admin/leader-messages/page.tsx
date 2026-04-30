import { requireActorFromSession } from "@/lib/auth-context";
import { getAllLeaderMessages } from "@/lib/services/leaderMessages";
import { LeaderMessagesClient } from "./LeaderMessagesClient";

export const metadata = { title: "Leader Messages" };

export default async function LeaderMessagesAdminPage() {
  await requireActorFromSession();
  const messages = await getAllLeaderMessages();
  return <LeaderMessagesClient messages={messages} />;
}
