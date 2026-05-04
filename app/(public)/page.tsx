import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getActiveHeroSlides } from "@/lib/services/heroSlides";
import { getActiveTestimonials } from "@/lib/services/testimonials";
import { getActiveLeaderMessages } from "@/lib/services/leaderMessages";
import { getActiveSiteStats } from "@/lib/services/siteStats";
import { HeroSlider } from "@/components/public/HeroSlider";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { LeaderMessageSection } from "@/components/public/LeaderMessageSection";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { FALLBACK_IMAGES } from "@/lib/utils/images";
import { db } from "@/lib/db";
import {
  Heart,
  Users,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Globe,
  HandHeart,
  Calendar,
  MapPin,
  Briefcase,
  Sparkles,
  History,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  organizationJsonLd,
  webSiteJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Gloford Foundation — strengthening communities through health, youth empowerment, climate resilience, and information access across Uganda.",
  openGraph: {
    title: "Gloford Foundation",
    description:
      "Strengthening communities through health, youth empowerment, and climate resilience across Uganda.",
    type: "website",
    url: APP_URL,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image", title: "Gloford Foundation" },
};

export default async function HomePage() {
  const t = await getTranslations("public.home");
  const [
    slides,
    testimonials,
    leaderMessages,
    siteStats,
    latestPosts,
    upcomingEvents,
    openPositions,
    impactStories,
    galleryImages,
  ] = await Promise.all([
    getActiveHeroSlides(),
    getActiveTestimonials(),
    getActiveLeaderMessages(),
    getActiveSiteStats(),
    db.post
      .findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          publishedAt: true,
          cover: { select: { url: true, alt: true } },
        },
      })
      .catch(() => []),
    db.event
      .findMany({
        where: { isPublic: true, startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 3,
        select: {
          id: true,
          slug: true,
          title: true,
          startsAt: true,
          location: true,
          cover: { select: { url: true, alt: true } },
        },
      })
      .catch(() => []),
    db.career
      .findMany({
        where: { isActive: true },
        take: 3,
        select: {
          slug: true,
          title: true,
          department: true,
          location: true,
          type: true,
        },
      })
      .catch(() => []),
    db.page
      .findMany({
        where: { slug: { startsWith: "impact-story-" }, status: "PUBLISHED" },
        take: 3,
        orderBy: { publishedAt: "desc" },
        select: { slug: true, title: true, seoDesc: true },
      })
      .catch(() => []),
    db.media
      .findMany({
        where: { mime: { startsWith: "image/" } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, url: true, alt: true },
      })
      .catch(() => []),
  ]);

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          webSiteJsonLd(),
          breadcrumbJsonLd([{ name: "Home", href: "/" }]),
        ]}
      />

      {/* ── Section 1: Hero Slider ── */}
      {slides.length > 0 ? (
        <HeroSlider
          slides={slides.map((s) => ({
            id: s.id,
            title: s.title,
            subtitle: s.subtitle,
            ctaLabel: s.ctaLabel,
            ctaHref: s.ctaHref,
            imageUrl: s.imageUrl,
            imageAlt: s.imageAlt,
            durationMs: s.durationMs,
          }))}
        />
      ) : (
        <FallbackHero />
      )}

      {/* ── Section 2: Animated Stats (muted bg) ── */}
      <DynamicStatsSection dbStats={siteStats} t={t} />

      {/* ── Section 3: About Intro (light gradient bg) ── */}
      <AboutIntroSection t={t} />

      {/* ── Section 4: Leader Messages (white bg) ── */}
      {leaderMessages.length > 0 && (
        <LeaderMessageSection messages={leaderMessages} heading={t("leaderMessagesHeading")} />
      )}

      {/* ── Section 5: What We Do (muted bg) ── */}
      <WhatWeDoSection t={t} />

      {/* ── Section 6: Latest Blog Posts ── */}
      {latestPosts.length > 0 && <LatestPostsSection posts={latestPosts} t={t} />}

      {/* ── Section 7: Upcoming Events ── */}
      {upcomingEvents.length > 0 && (
        <UpcomingEventsSection events={upcomingEvents} t={t} />
      )}

      {/* ── Section 8: Open Positions ── */}
      {openPositions.length > 0 && (
        <OpenPositionsSection positions={openPositions} t={t} />
      )}

      {/* ── Section 9: Impact Stories ── */}
      {impactStories.length > 0 && (
        <ImpactStoriesSection stories={impactStories} t={t} />
      )}

      {/* ── Section 10: Brief History ── */}
      <BriefHistorySection t={t} />

      {/* ── Section 11: Mini Gallery ── */}
      {galleryImages.length > 0 && (
        <MiniGallerySection images={galleryImages} t={t} />
      )}

      {/* ── Section 12: Testimonials ── */}
      {testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}

      {/* ── Section 13: Get Involved CTA ── */}
      <GetInvolvedSection t={t} />
    </>
  );
}

/* ─── Stats Section ─── */
async function DynamicStatsSection({
  dbStats,
  t,
}: {
  dbStats: Array<{
    id: string;
    label: string;
    value: string;
    icon: string | null;
  }>;
  t: (key: string) => string;
}) {
  // Auto-compute live stats from real DB data
  const [programCount, visitorEstimate] = await Promise.all([
    db.program.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
    // Count unique donations + subscribers + contact submissions as "lives impacted"
    Promise.all([
      db.donation.count({ where: { status: "SUCCEEDED" } }).catch(() => 0),
      db.subscriber.count().catch(() => 0),
      db.event.count().catch(() => 0),
    ]).then(([d, s, e]) => d + s + e),
  ]);

  // Founding year — calculate years of impact
  const foundingYear = 2017;
  const yearsOfImpact = new Date().getFullYear() - foundingYear;

  // Build auto stats, then overlay admin-configured ones
  const autoStats = [
    { id: "_communities", label: t("statsCommunitiesServed"), value: "45+", icon: "Users" },
    { id: "_lives", label: t("statsLivesImpacted"), value: visitorEstimate > 0 ? `${visitorEstimate.toLocaleString("en")}+` : "500+", icon: "Heart" },
    { id: "_programs", label: t("statsActivePrograms"), value: programCount > 0 ? `${programCount}` : "8", icon: "Briefcase" },
    { id: "_years", label: t("statsYearsOfImpact"), value: `${yearsOfImpact}+`, icon: "Calendar" },
  ];

  // Use admin DB stats if they exist, otherwise use auto-computed
  const stats = dbStats.length > 0 ? dbStats : autoStats;

  return (
    <section className="bg-[rgb(var(--token-muted)/0.30)] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.id} delay={i * 0.1}>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                  <TrendingUp className="h-7 w-7 text-[var(--color-primary)]" />
                </div>
                <AnimatedCounter
                  value={stat.value}
                  className="block text-3xl font-bold text-[var(--color-fg)] sm:text-4xl"
                />
                <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
                  {stat.label}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── About Intro Section ─── */
function AboutIntroSection({ t }: { t: (key: string) => string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[rgb(240_247_244)] via-white to-[rgb(220_237_230)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("aboutEyebrow")}
            </p>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl lg:text-5xl">
              {t("aboutHeading")}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted-fg)]">
              {t("aboutDesc")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/who-we-are"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
              >
                {t("aboutOurStory")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
              >
                {t("aboutOurPrograms")}
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── What We Do Section ─── */
function WhatWeDoSection({ t }: { t: (key: string) => string }) {
  const cards = [
    {
      icon: BookOpen,
      title: t("whatWeDoEducation"),
      desc: t("whatWeDoEducationDesc"),
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Heart,
      title: t("whatWeDoHealthcare"),
      desc: t("whatWeDoHealthcareDesc"),
      color: "from-rose-500 to-rose-600",
    },
    {
      icon: Users,
      title: t("whatWeDoCommunity"),
      desc: t("whatWeDoCommunityDesc"),
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: Globe,
      title: t("whatWeDoEnvironment"),
      desc: t("whatWeDoEnvironmentDesc"),
      color: "from-teal-500 to-teal-600",
    },
  ];

  return (
    <section className="bg-[rgb(248_250_249)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("whatWeDoEyebrow")}
            </p>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {t("whatWeDoHeading")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 0.1}>
              <div className="group rounded-2xl bg-white border border-[var(--color-border)] p-8 shadow-sm transition hover:shadow-xl">
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}
                >
                  <card.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-[var(--color-fg)]">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted-fg)]">
                  {card.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Latest Blog Posts Section ─── */
function LatestPostsSection({
  posts,
  t,
}: {
  posts: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: Date | null;
    cover: { url: string; alt: string | null } | null;
  }>;
  t: (key: string) => string;
}) {
  return (
    <section className="bg-[var(--color-bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("blogEyebrow")}
            </p>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {t("blogHeading")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <ScrollReveal key={post.id} delay={i * 0.1}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:shadow-xl"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[rgb(248_250_249)]">
                  {post.cover?.url ? (
                    <Image
                      src={post.cover.url}
                      alt={post.cover.alt ?? post.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-10 w-10 text-[rgb(var(--token-muted-fg)/0.30)]" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  {post.publishedAt && (
                    <time className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-fg)]">
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  )}
                  <h3 className="mt-2 text-lg font-bold text-[var(--color-fg)] line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-fg)] line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
                    {t("blogReadMore")} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
            >
              {t("blogViewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Upcoming Events Section ─── */
function UpcomingEventsSection({
  events,
  t,
}: {
  events: Array<{
    id: string;
    slug: string;
    title: string;
    startsAt: Date;
    location: string | null;
    cover: { url: string; alt: string | null } | null;
  }>;
  t: (key: string) => string;
}) {
  return (
    <section className="bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("eventsEyebrow")}
            </p>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {t("eventsHeading")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => {
            const d = new Date(event.startsAt);
            return (
              <ScrollReveal key={event.id} delay={i * 0.1}>
                <Link
                  href={`/events/${event.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:shadow-xl"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[rgb(248_250_249)]">
                    {event.cover?.url ? (
                      <Image
                        src={event.cover.url}
                        alt={event.cover.alt ?? event.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Calendar className="h-10 w-10 text-[rgb(var(--token-muted-fg)/0.30)]" />
                      </div>
                    )}
                    {/* Date badge */}
                    <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-3 py-2 text-center shadow-lg backdrop-blur-sm">
                      <span className="block text-xs font-bold uppercase text-[var(--color-primary)]">
                        {d.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="block text-2xl font-bold leading-none text-[var(--color-fg)]">
                        {d.getDate()}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-[var(--color-fg)] line-clamp-2">
                      {event.title}
                    </h3>
                    {event.location && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-muted-fg)]">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {event.location}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
                      {t("eventsLearnMore")} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
            >
              {t("eventsViewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Open Positions Section ─── */
function OpenPositionsSection({
  positions,
  t,
}: {
  positions: Array<{
    slug: string;
    title: string;
    department: string;
    location: string;
    type: string;
  }>;
  t: (key: string) => string;
}) {
  const typeLabel = (tp: string) =>
    tp.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("careersEyebrow")}
            </p>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {t("careersHeading")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="mx-auto max-w-3xl space-y-4">
          {positions.map((pos, i) => (
            <ScrollReveal key={pos.slug} delay={i * 0.1}>
              <Link
                href={`/careers/${pos.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm transition hover:shadow-xl hover:border-[rgb(var(--token-primary)/0.30)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                    <Briefcase className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-fg)]">
                      {pos.title}
                    </h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-muted-fg)]">
                      <span>{pos.department}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {pos.location}
                      </span>
                      <span className="hidden sm:inline">·</span>
                      <span className="rounded-full bg-[rgb(var(--token-primary)/0.10)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                        {typeLabel(pos.type)}
                      </span>
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-muted-fg)] transition group-hover:text-[var(--color-primary)] group-hover:translate-x-1" />
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
            >
              {t("careersViewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Impact Stories Section ─── */
function ImpactStoriesSection({
  stories,
  t,
}: {
  stories: Array<{
    slug: string;
    title: string;
    seoDesc: string | null;
  }>;
  t: (key: string) => string;
}) {
  return (
    <section className="bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("impactEyebrow")}
            </p>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {t("impactHeading")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--color-muted-fg)]">
              {t("impactDesc")}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, i) => (
            <ScrollReveal key={story.slug} delay={i * 0.1}>
              <Link
                href={`/impact-stories/${story.slug.replace(/^impact-story-/, "")}`}
                className="group block rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm transition hover:shadow-xl hover:border-[rgb(var(--token-primary)/0.30)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                  <Sparkles className="h-6 w-6 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-fg)] line-clamp-2">
                  {story.title}
                </h3>
                {story.seoDesc && (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-fg)] line-clamp-3">
                    {story.seoDesc}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
                  {t("impactReadStory")} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/impact-stories"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
            >
              {t("impactViewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Brief History Section ─── */
function BriefHistorySection({ t }: { t: (key: string) => string }) {
  return (
    <section className="bg-[rgb(248_250_249)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <ScrollReveal>
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                <History className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {t("historyEyebrow")}
              </p>
              <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
                {t("historyHeading")}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[var(--color-muted-fg)]">
                {t("historyDesc")}
              </p>
              <div className="mt-8">
                <Link
                  href="/our-history"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                >
                  {t("historyLearnMore")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={FALLBACK_IMAGES.hero}
                alt={t("historyImageAlt")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/* ─── Mini Gallery Section ─── */
function MiniGallerySection({
  images,
  t,
}: {
  images: Array<{ id: string; url: string; alt: string | null }>;
  t: (key: string) => string;
}) {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("galleryEyebrow")}
            </p>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {t("galleryHeading")}
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((img, i) => (
            <ScrollReveal key={img.id} delay={i * 0.05}>
              <div className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[rgb(248_250_249)]">
                <Image
                  src={img.url}
                  alt={img.alt ?? t("galleryImageAlt")}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
            >
              {t("galleryViewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Get Involved CTA ─── */
function GetInvolvedSection({ t }: { t: (key: string) => string }) {
  const actions = [
    {
      icon: Heart,
      title: t("ctaDonateTitle"),
      desc: t("ctaDonateDesc"),
      href: "/donate",
      label: t("ctaDonateLabel"),
    },
    {
      icon: HandHeart,
      title: t("ctaVolunteerTitle"),
      desc: t("ctaVolunteerDesc"),
      href: "/volunteer",
      label: t("ctaVolunteerLabel"),
    },
    {
      icon: Users,
      title: t("ctaPartnerTitle"),
      desc: t("ctaPartnerDesc"),
      href: "/partners",
      label: t("ctaPartnerLabel"),
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[rgb(240_247_244)] via-white to-[rgb(230_242_236)] py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {t("ctaEyebrow")}
            </p>
            <h2 className="font-display text-3xl font-bold text-[var(--color-fg)] sm:text-4xl">
              {t("ctaHeading")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--color-muted-fg)]">
              {t("ctaDesc")}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 sm:grid-cols-3">
          {actions.map((action, i) => (
            <ScrollReveal key={action.title} delay={i * 0.15}>
              <div className="group rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm transition hover:shadow-xl hover:border-[rgb(var(--token-primary)/0.30)]">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgb(var(--token-primary)/0.10)]">
                  <action.icon className="h-7 w-7 text-[var(--color-primary)]" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-[var(--color-fg)]">
                  {action.title}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-[var(--color-muted-fg)]">
                  {action.desc}
                </p>
                <Link
                  href={action.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] transition group-hover:gap-3"
                >
                  {action.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Fallback Hero (when no slides exist) ─── */
async function FallbackHero() {
  const t = await getTranslations("public.hero");
  const tHome = await getTranslations("public.home");
  return (
    <section className="relative min-h-[75vh] overflow-hidden bg-[rgb(26_40_35)]">
      <Image
        src={FALLBACK_IMAGES.hero}
        alt="Community action"
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      <div className="relative z-10 mx-auto flex min-h-[75vh] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-6">
          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            {t("heading")}
          </h1>
          <p className="max-w-lg text-lg text-white/85 sm:text-xl">
            {t("subheading")}
          </p>
          <div className="flex gap-4">
            <Link
              href="/donate"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
            >
              <Heart className="h-4 w-4" /> {t("cta")}
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {tHome("fallbackOurPrograms")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
