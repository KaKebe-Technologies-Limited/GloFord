import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests verifying that all update server actions call
 * revalidatePath for BOTH the list page AND the edit page.
 *
 * This was the root cause of "changes not being committed" — the edit
 * page served stale cached data because only the list was revalidated.
 */

const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();
const mockRedirect = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  unstable_cache: (fn: Function) => fn,
}));
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

// Mock auth — always returns a valid actor
vi.mock("@/lib/auth-context", () => ({
  requireActorFromSession: vi.fn().mockResolvedValue({
    userId: "user_1",
    role: "ADMIN",
    organizationId: "org_1",
  }),
}));

// Track what service functions return
const mockPageRow = { id: "page_1", slug: "about" };
const mockPostRow = { id: "post_1", slug: "hello-world" };
const mockProgramRow = { id: "prog_1", slug: "education" };
const mockNewsletterRow = { id: "nl_1" };
const mockCampaignRow = { id: "camp_1" };
const mockEmailCampaignRow = { id: "ec_1" };

vi.mock("@/lib/services/pages", () => ({
  createPage: vi.fn().mockResolvedValue(mockPageRow),
  updatePage: vi.fn().mockResolvedValue(mockPageRow),
  setPageStatus: vi.fn().mockResolvedValue(mockPageRow),
  deletePage: vi.fn().mockResolvedValue(mockPageRow),
}));

vi.mock("@/lib/services/posts", () => ({
  createPost: vi.fn().mockResolvedValue(mockPostRow),
  updatePost: vi.fn().mockResolvedValue(mockPostRow),
  setPostStatus: vi.fn().mockResolvedValue(mockPostRow),
  deletePost: vi.fn().mockResolvedValue(mockPostRow),
}));

vi.mock("@/lib/services/programs", () => ({
  createProgram: vi.fn().mockResolvedValue(mockProgramRow),
  updateProgram: vi.fn().mockResolvedValue(mockProgramRow),
  setProgramStatus: vi.fn().mockResolvedValue(mockProgramRow),
  deleteProgram: vi.fn().mockResolvedValue(mockProgramRow),
}));

vi.mock("@/lib/services/newsletters", () => ({
  createNewsletter: vi.fn().mockResolvedValue(mockNewsletterRow),
  updateNewsletter: vi.fn().mockResolvedValue(mockNewsletterRow),
  scheduleNewsletter: vi.fn(),
  sendNewsletterNow: vi.fn(),
  deleteNewsletter: vi.fn(),
}));

vi.mock("@/lib/services/campaigns", () => ({
  createCampaign: vi.fn().mockResolvedValue(mockCampaignRow),
  updateCampaign: vi.fn().mockResolvedValue(mockCampaignRow),
  toggleCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
}));

vi.mock("@/lib/services/emailCampaigns", () => ({
  createEmailCampaign: vi.fn().mockResolvedValue(mockEmailCampaignRow),
  updateEmailCampaign: vi.fn().mockResolvedValue(mockEmailCampaignRow),
  deleteEmailCampaign: vi.fn(),
  activateEmailCampaign: vi.fn(),
  createCampaignEmail: vi.fn(),
  updateCampaignEmail: vi.fn(),
  deleteCampaignEmail: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { subscriber: { count: vi.fn().mockResolvedValue(0) } },
}));

describe("Update actions revalidate edit pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updatePageAction revalidates both list and edit page", async () => {
    const { updatePageAction } = await import("@/lib/actions/pages");
    await updatePageAction({ id: "page_1", title: "Updated" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/pages");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/pages/page_1");
  });

  it("setPageStatusAction revalidates edit page", async () => {
    const { setPageStatusAction } = await import("@/lib/actions/pages");
    await setPageStatusAction({ id: "page_1", status: "PUBLISHED" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/pages");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/pages/page_1");
  });

  it("updatePostAction revalidates both list and edit page", async () => {
    const { updatePostAction } = await import("@/lib/actions/posts");
    await updatePostAction({ id: "post_1", title: "Updated" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/posts");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/posts/post_1");
  });

  it("setPostStatusAction revalidates edit page", async () => {
    const { setPostStatusAction } = await import("@/lib/actions/posts");
    await setPostStatusAction({ id: "post_1", status: "PUBLISHED" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/posts");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/posts/post_1");
  });

  it("updateProgramAction revalidates both list and edit page", async () => {
    const { updateProgramAction } = await import("@/lib/actions/programs");
    await updateProgramAction({ id: "prog_1", title: "Updated" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/programs");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/programs/prog_1");
  });

  it("setProgramStatusAction revalidates edit page", async () => {
    const { setProgramStatusAction } = await import("@/lib/actions/programs");
    await setProgramStatusAction({ id: "prog_1", status: "PUBLISHED" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/programs");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/programs/prog_1");
  });

  it("updateNewsletterAction revalidates both list and edit page", async () => {
    const { updateNewsletterAction } = await import("@/lib/actions/newsletters");
    await updateNewsletterAction({ id: "nl_1", title: "Updated" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/newsletters");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/newsletters/nl_1");
  });

  it("updateCampaignAction revalidates both list and edit page", async () => {
    const { updateCampaignAction } = await import("@/lib/actions/campaigns");
    await updateCampaignAction({ id: "camp_1", title: "Updated" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/campaigns");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/campaigns/camp_1");
  });

  it("updateEmailCampaignAction revalidates both list and edit page", async () => {
    const { updateEmailCampaignAction } = await import("@/lib/actions/emailCampaigns");
    await updateEmailCampaignAction({ id: "ec_1", name: "Updated" });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/email-campaigns");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/email-campaigns/ec_1");
  });
});

describe("Theme action revalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updateThemeAction revalidates theme page and root layout", async () => {
    vi.mock("@/lib/services/theme", () => ({
      updateTheme: vi.fn().mockResolvedValue({ id: "singleton" }),
    }));

    const { updateThemeAction } = await import("@/lib/actions/theme");
    await updateThemeAction({ colors: { primary: "30 80 160" } });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/theme");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
