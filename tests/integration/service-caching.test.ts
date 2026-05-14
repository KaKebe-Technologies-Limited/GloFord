import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests verifying that write operations in services
 * call revalidateTag to bust the cache. Tests the critical fix
 * from Phase 2B where 15 services were missing revalidation.
 */

const mockRevalidateTag = vi.fn();
const mockDb = {
  siteImage: {
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue({ id: "1", key: "hero", label: "Hero", url: "/img.png", alt: null }),
    delete: vi.fn().mockResolvedValue({ id: "1" }),
  },
  translation: {
    findMany: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue({ id: "1", locale: "en", key: "x", value: "y" }),
    delete: vi.fn().mockResolvedValue({ id: "1", locale: "en", key: "x", value: "y" }),
  },
  $transaction: vi.fn((fns: unknown[]) => Promise.all(fns as Promise<unknown>[])),
  teamMember: {
    create: vi.fn().mockResolvedValue({ id: "tm_1" }),
    update: vi.fn().mockResolvedValue({ id: "tm_1" }),
    delete: vi.fn().mockResolvedValue({ id: "tm_1" }),
    findMany: vi.fn().mockResolvedValue([]),
  },
};

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  unstable_cache: (fn: Function) => fn,
}));
vi.mock("@/lib/rbac/authorize", () => ({ authorize: vi.fn() }));
vi.mock("@/lib/inngest/client", () => ({ inngest: { send: vi.fn().mockResolvedValue(undefined) } }));

describe("Service caching - revalidateTag on writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("siteImages", () => {
    it("calls revalidateTag on upsert", async () => {
      const { upsertSiteImage } = await import("@/lib/services/siteImages/index");
      await upsertSiteImage({ key: "hero", label: "Hero", url: "/img.png" });
      expect(mockRevalidateTag).toHaveBeenCalledWith("site-images");
    });

    it("calls revalidateTag on delete", async () => {
      const { deleteSiteImage } = await import("@/lib/services/siteImages/index");
      await deleteSiteImage("1");
      expect(mockRevalidateTag).toHaveBeenCalledWith("site-images");
    });
  });

  describe("translations", () => {
    it("calls revalidateTag on upsert with correct locale tag", async () => {
      const { upsertTranslation } = await import("@/lib/services/translations/index");
      await upsertTranslation("sw", "home.title", "Karibu");
      expect(mockRevalidateTag).toHaveBeenCalledWith("translations-sw");
    });

    it("calls revalidateTag on delete with locale from deleted row", async () => {
      const { deleteTranslation } = await import("@/lib/services/translations/index");
      await deleteTranslation("1");
      expect(mockRevalidateTag).toHaveBeenCalledWith("translations-en");
    });

    it("calls revalidateTag on bulk upsert", async () => {
      mockDb.$transaction.mockResolvedValue([{ id: "1" }, { id: "2" }]);
      const { bulkUpsertTranslations } = await import("@/lib/services/translations/index");
      await bulkUpsertTranslations("fr", [
        { key: "a", value: "1" },
        { key: "b", value: "2" },
      ]);
      expect(mockRevalidateTag).toHaveBeenCalledWith("translations-fr");
    });
  });

  describe("teamMembers", () => {
    it("calls revalidateTag on create", async () => {
      const { createTeamMember } = await import("@/lib/services/teamMembers/index");
      const actor = { userId: "u1", role: "SUPER_ADMIN", roleId: "r1", email: "a@b.com" };
      await createTeamMember(actor, { name: "Jane", role: "CTO" });
      expect(mockRevalidateTag).toHaveBeenCalledWith("team-members");
    });

    it("calls revalidateTag on update", async () => {
      const { updateTeamMember } = await import("@/lib/services/teamMembers/index");
      const actor = { userId: "u1", role: "SUPER_ADMIN", roleId: "r1", email: "a@b.com" };
      await updateTeamMember(actor, "tm_1", { name: "Jane Updated" });
      expect(mockRevalidateTag).toHaveBeenCalledWith("team-members");
    });

    it("calls revalidateTag on delete", async () => {
      const { deleteTeamMember } = await import("@/lib/services/teamMembers/index");
      const actor = { userId: "u1", role: "SUPER_ADMIN", roleId: "r1", email: "a@b.com" };
      await deleteTeamMember(actor, "tm_1");
      expect(mockRevalidateTag).toHaveBeenCalledWith("team-members");
    });
  });
});
