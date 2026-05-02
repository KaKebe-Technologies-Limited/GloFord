import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTeamMembersByDepartment } from "@/lib/services/teamMembers";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Facebook, Twitter, Linkedin, Instagram, Globe } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Our Leadership",
  description:
    "Meet the dedicated team guiding our mission, strategy, and programs across communities.",
  openGraph: {
    title: "Our Leadership",
    description:
      "Meet the dedicated team guiding our mission, strategy, and programs across communities.",
    type: "website",
    url: `${APP_URL}/leadership`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Our Leadership" },
};

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  website: Globe,
};

const SECTION_STYLES = [
  "bg-[var(--color-bg)]",
  "bg-[rgb(var(--token-muted)/0.30)]",
  "bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)]",
  "bg-[rgb(var(--token-muted)/0.20)]",
];

export default async function LeadershipPage() {
  const t = await getTranslations("public.leadership");
  const grouped = await getTeamMembersByDepartment();
  const departments = Object.entries(grouped);

  return (
    <>
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[rgb(248_250_249)] via-white to-[rgb(240_247_244)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <ScrollReveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--color-fg)] sm:text-5xl lg:text-6xl">
              {t("heading")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-muted-fg)]">
              {t("subheading")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Departments */}
      {departments.length === 0 ? (
        <section className="w-full px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-[var(--color-muted-fg)]">
              {t("empty")}
            </p>
          </div>
        </section>
      ) : (
        departments.map(([dept, members], deptIndex) => {
          const styleClass = SECTION_STYLES[deptIndex % SECTION_STYLES.length]!;

          return (
            <section
              key={dept}
              className={`w-full px-4 py-20 sm:px-6 sm:py-28 lg:px-8 ${styleClass}`}
            >
              <div className="mx-auto max-w-7xl">
                <ScrollReveal>
                  <h2
                    className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
                  >
                    {dept}
                  </h2>
                  <div className="mt-2 h-1 w-16 rounded-full bg-[var(--color-primary)]" />
                </ScrollReveal>

                <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {members.map((member, i) => {
                    const socials = (member.socialLinks ?? {}) as Record<
                      string,
                      string
                    >;

                    return (
                      <ScrollReveal key={member.id} delay={i * 0.06}>
                        <div
                          className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                          {/* Photo */}
                          <div className="relative aspect-[3/3.5] overflow-hidden">
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgb(var(--token-primary)/0.10)] to-[rgb(var(--token-muted)/0.30)]">
                                <span className="text-5xl font-bold text-[rgb(var(--token-muted-fg)/0.30)]">
                                  {member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </span>
                              </div>
                            )}
                            {/* Hover overlay with social icons */}
                            {Object.keys(socials).length > 0 && (
                              <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <div className="mb-4 flex gap-3">
                                  {Object.entries(socials).map(
                                    ([platform, url]) => {
                                      const Icon = SOCIAL_ICONS[platform];
                                      if (!Icon || !url) return null;
                                      return (
                                        <a
                                          key={platform}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
                                        >
                                          <Icon className="h-4 w-4" />
                                        </a>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="space-y-2 p-5">
                            <h3
                              className="text-lg font-semibold"
                            >
                              {member.name}
                            </h3>
                            <p
                              className="text-sm font-medium text-[var(--color-primary)]"
                            >
                              {member.role}
                            </p>
                            {member.bio && (
                              <p
                                className="line-clamp-3 text-sm leading-relaxed text-[var(--color-muted-fg)]"
                              >
                                {member.bio}
                              </p>
                            )}

                            {/* Social icons (always visible, below card) */}
                            {Object.keys(socials).length > 0 && (
                              <div className="flex gap-2 pt-2">
                                {Object.entries(socials).map(
                                  ([platform, url]) => {
                                    const Icon = SOCIAL_ICONS[platform];
                                    if (!Icon || !url) return null;
                                    return (
                                      <a
                                        key={platform}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted-fg)] transition-colors hover:bg-[rgb(var(--token-muted)/0.50)] hover:text-[var(--color-fg)]"
                                      >
                                        <Icon className="h-4 w-4" />
                                      </a>
                                    );
                                  },
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
