/**
 * Cache tag conventions.
 *
 * Reads use `unstable_cache` with these tags. Admin mutations call
 * `revalidateTag(tag)` via the service layer so public pages update
 * without client-side fetching.
 */

export const tags = {
  theme: (orgId: string) => `theme:${orgId}`,
  siteSettings: (orgId: string) => `site-settings:${orgId}`,
  nav: (orgId: string, location: string) => `nav:${orgId}:${location}`,
  pages: (orgId: string) => `pages:${orgId}`,
  page: (orgId: string, slug: string) => `page:${orgId}:${slug}`,
  programs: (orgId: string) => `programs:${orgId}`,
  program: (orgId: string, slug: string) => `program:${orgId}:${slug}`,
  posts: (orgId: string) => `posts:${orgId}`,
  post: (orgId: string, slug: string) => `post:${orgId}:${slug}`,
  campaigns: (orgId: string) => `campaigns:${orgId}`,
  featureFlags: (orgId: string | null) => `feature-flags:${orgId ?? "global"}`,
} as const;
