export type PageCollectionKind = "impactStory" | "team" | "report" | "partner" | "press";

export const PAGE_COLLECTIONS: Record<
  PageCollectionKind,
  {
    prefix: string;
    basePath: string;
    adminPath: string;
    title: string;
    singular: string;
  }
> = {
  impactStory: {
    prefix: "impact-story-",
    basePath: "/impact-stories",
    adminPath: "/admin/impact-stories",
    title: "Impact Stories",
    singular: "Impact story",
  },
  team: {
    prefix: "leadership-",
    basePath: "/leadership",
    adminPath: "/admin/team",
    title: "Leadership",
    singular: "Team member",
  },
  report: {
    prefix: "report-",
    basePath: "/reports",
    adminPath: "/admin/reports",
    title: "Reports",
    singular: "Report",
  },
  partner: {
    prefix: "partner-",
    basePath: "/partners",
    adminPath: "/admin/partners",
    title: "Partners",
    singular: "Partner",
  },
  press: {
    prefix: "press-",
    basePath: "/press",
    adminPath: "/admin/press",
    title: "Press & Media",
    singular: "Press release",
  },
};

export function getCollectionConfig(kind: PageCollectionKind) {
  return PAGE_COLLECTIONS[kind];
}

export function toCollectionSlug(kind: PageCollectionKind, leafSlug: string) {
  return `${PAGE_COLLECTIONS[kind].prefix}${leafSlug}`;
}

export function fromCollectionSlug(kind: PageCollectionKind, fullSlug: string) {
  return fullSlug.startsWith(PAGE_COLLECTIONS[kind].prefix)
    ? fullSlug.slice(PAGE_COLLECTIONS[kind].prefix.length)
    : fullSlug;
}

export function toCollectionPath(kind: PageCollectionKind, fullSlug: string) {
  const config = PAGE_COLLECTIONS[kind];
  return `${config.basePath}/${fromCollectionSlug(kind, fullSlug)}`;
}
