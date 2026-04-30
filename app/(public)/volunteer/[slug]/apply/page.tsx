import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVolunteerBySlug } from "@/lib/services/volunteer";
import { VolunteerApplyForm } from "./VolunteerApplyForm";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const opp = await getVolunteerBySlug(slug);
    return {
      title: `Apply - ${opp.title}`,
      description: `Apply to volunteer as ${opp.title} with us.`,
    };
  } catch {
    return { title: "Apply" };
  }
}

export default async function VolunteerApplyPage({ params }: Props) {
  const { slug } = await params;
  let opp;
  try {
    opp = await getVolunteerBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <section className="w-full bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <VolunteerApplyForm
          opportunityId={opp.id}
          opportunityTitle={opp.title}
          opportunityDepartment={opp.department}
          opportunityLocation={opp.location}
          opportunityCommitment={opp.commitment}
          slug={opp.slug}
        />
      </div>
    </section>
  );
}
