import { db } from "@/lib/db";

export async function submitPartnerApplication(data: {
  organizationName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  description: string;
  partnershipType: string;
  message?: string;
}) {
  return db.partnerApplication.create({ data });
}

export async function getAllPartnerApplications() {
  return db.partnerApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updatePartnerApplicationStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  reviewedById?: string,
) {
  return db.partnerApplication.update({
    where: { id },
    data: { status, reviewedById },
  });
}
