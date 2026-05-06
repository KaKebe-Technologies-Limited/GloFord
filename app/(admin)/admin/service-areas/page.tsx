import { requireActorFromSession } from "@/lib/auth-context";
import { listServiceAreas } from "@/lib/services/serviceAreas";
import { ServiceAreasClient } from "./ServiceAreasClient";

export const metadata = { title: "Service Areas" };

export default async function ServiceAreasAdminPage() {
  await requireActorFromSession();
  const areas = await listServiceAreas();
  return <ServiceAreasClient areas={areas} />;
}
