import { requireActorFromSession } from "@/lib/auth-context";
import { getAllTestimonials } from "@/lib/services/testimonials";
import { TestimonialsClient } from "./TestimonialsClient";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsAdminPage() {
  await requireActorFromSession();
  const testimonials = await getAllTestimonials();
  return <TestimonialsClient testimonials={testimonials} />;
}
