/**
 * JSON-LD structured data helpers (schema.org).
 *
 * Each function returns a plain object ready for JSON.stringify.
 * Import from `@/lib/seo/json-ld` and pass to `<JsonLd>`.
 */

import { getBrand } from "@/config/brand";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

function brand() {
  return getBrand();
}

function abs(path: string): string {
  const b = brand();
  if (path.startsWith("http")) return path;
  return `${b.siteUrl.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

/* ------------------------------------------------------------------ */
/*  1. Organization                                                    */
/* ------------------------------------------------------------------ */

export function organizationJsonLd() {
  const b = brand();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: b.name,
    url: b.siteUrl,
    logo: b.logoUrl ? abs(b.logoUrl) : undefined,
    contactPoint: b.supportEmail
      ? {
          "@type": "ContactPoint",
          email: b.supportEmail,
          contactType: "customer support",
        }
      : undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  2. WebSite with SearchAction                                       */
/* ------------------------------------------------------------------ */

export function webSiteJsonLd() {
  const b = brand();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: b.name,
    url: b.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${b.siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  3. BlogPosting                                                     */
/* ------------------------------------------------------------------ */

export interface BlogPostingInput {
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: Date | string | null;
  modifiedAt?: Date | string | null;
  authorName?: string | null;
  coverUrl?: string | null;
  tags?: string[];
}

export function blogPostingJsonLd(post: BlogPostingInput) {
  const b = brand();
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    url: abs(`/blog/${post.slug}`),
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    dateModified: post.modifiedAt
      ? new Date(post.modifiedAt).toISOString()
      : post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : { "@type": "Organization", name: b.name },
    publisher: {
      "@type": "Organization",
      name: b.name,
      logo: b.logoUrl
        ? { "@type": "ImageObject", url: abs(b.logoUrl) }
        : undefined,
    },
    image: post.coverUrl ? abs(post.coverUrl) : undefined,
    keywords: post.tags?.length ? post.tags.join(", ") : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": abs(`/blog/${post.slug}`),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  4. Event                                                           */
/* ------------------------------------------------------------------ */

export interface EventInput {
  title: string;
  slug: string;
  description?: string | null;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  location?: string | null;
  coverUrl?: string | null;
  isOnline?: boolean;
}

export function eventJsonLd(event: EventInput) {
  const b = brand();
  const startDate = new Date(event.startsAt).toISOString();
  const endDate = event.endsAt
    ? new Date(event.endsAt).toISOString()
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    url: abs(`/events/${event.slug}`),
    startDate,
    endDate,
    image: event.coverUrl ? abs(event.coverUrl) : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: event.isOnline
      ? { "@type": "VirtualLocation", url: abs(`/events/${event.slug}`) }
      : event.location
        ? { "@type": "Place", name: event.location }
        : undefined,
    organizer: {
      "@type": "Organization",
      name: b.name,
      url: b.siteUrl,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  5. JobPosting                                                      */
/* ------------------------------------------------------------------ */

export interface JobPostingInput {
  title: string;
  slug: string;
  description: string;
  department?: string;
  location?: string;
  type?: string; // FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, VOLUNTEER
  salaryRange?: string | null;
  applicationDeadline?: Date | string | null;
  postedAt?: Date | string | null;
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
  VOLUNTEER: "VOLUNTEER",
};

export function jobPostingJsonLd(job: JobPostingInput) {
  const b = brand();
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    url: abs(`/careers/${job.slug}`),
    datePosted: job.postedAt
      ? new Date(job.postedAt).toISOString()
      : new Date().toISOString(),
    validThrough: job.applicationDeadline
      ? new Date(job.applicationDeadline).toISOString()
      : undefined,
    employmentType: job.type
      ? EMPLOYMENT_TYPE_MAP[job.type] ?? job.type
      : undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: b.name,
      sameAs: b.siteUrl,
      logo: b.logoUrl ? abs(b.logoUrl) : undefined,
    },
    jobLocation: job.location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location,
          },
        }
      : undefined,
    industry: job.department ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  6. Article (generic — programs, impact-stories, etc.)              */
/* ------------------------------------------------------------------ */

export interface ArticleInput {
  title: string;
  path: string; // e.g. "/programs/health-program"
  description?: string | null;
  publishedAt?: Date | string | null;
  modifiedAt?: Date | string | null;
  authorName?: string | null;
  coverUrl?: string | null;
}

export function articleJsonLd(article: ArticleInput) {
  const b = brand();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description ?? undefined,
    url: abs(article.path),
    datePublished: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : undefined,
    dateModified: article.modifiedAt
      ? new Date(article.modifiedAt).toISOString()
      : article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : undefined,
    author: article.authorName
      ? { "@type": "Person", name: article.authorName }
      : { "@type": "Organization", name: b.name },
    publisher: {
      "@type": "Organization",
      name: b.name,
      logo: b.logoUrl
        ? { "@type": "ImageObject", url: abs(b.logoUrl) }
        : undefined,
    },
    image: article.coverUrl ? abs(article.coverUrl) : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": abs(article.path),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  7. BreadcrumbList                                                  */
/* ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.href),
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  8. NGO / NonprofitOrganization                                     */
/* ------------------------------------------------------------------ */

export function nonprofitJsonLd() {
  const b = brand();
  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: b.name,
    url: b.siteUrl,
    logo: b.logoUrl ? abs(b.logoUrl) : undefined,
    description: `${b.name} — community partnerships for impact.`,
    contactPoint: b.supportEmail
      ? {
          "@type": "ContactPoint",
          email: b.supportEmail,
          contactType: "customer support",
        }
      : undefined,
    address: b.country
      ? {
          "@type": "PostalAddress",
          addressCountry: b.country,
        }
      : undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  9. ContactPage                                                     */
/* ------------------------------------------------------------------ */

export interface ContactPageInput {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export function contactPageJsonLd(contact?: ContactPageInput) {
  const b = brand();
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${b.name}`,
    url: abs("/contact"),
    mainEntity: {
      "@type": "Organization",
      name: b.name,
      url: b.siteUrl,
      email: contact?.email ?? b.supportEmail ?? undefined,
      telephone: contact?.phone ?? undefined,
      address: contact?.address
        ? { "@type": "PostalAddress", streetAddress: contact.address }
        : undefined,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  10. CollectionPage (listing pages)                                 */
/* ------------------------------------------------------------------ */

export interface CollectionPageInput {
  name: string;
  path: string;
  description?: string;
}

export function collectionPageJsonLd(page: CollectionPageInput) {
  const b = brand();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.name,
    description: page.description ?? undefined,
    url: abs(page.path),
    isPartOf: {
      "@type": "WebSite",
      name: b.name,
      url: b.siteUrl,
    },
  };
}
