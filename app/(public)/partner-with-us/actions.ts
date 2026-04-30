"use server";

import { submitPartnerApplication } from "@/lib/services/partnerApplications";

export async function submitPartnerInquiryAction(formData: FormData) {
  await submitPartnerApplication({
    organizationName: formData.get("organizationName") as string,
    contactName: formData.get("contactName") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    website: (formData.get("website") as string) || undefined,
    description: formData.get("description") as string,
    partnershipType: formData.get("partnershipType") as string,
    message: (formData.get("message") as string) || undefined,
  });
}
