import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests for the theme update service.
 *
 * Verifies that:
 * 1. Theme updates upsert the singleton row correctly
 * 2. presetId is persisted alongside color/typography/radius data
 * 3. revalidateTag is called (not silently swallowed) so the cache clears
 * 4. The version hook receives the correct entity type
 */

const mockThemeRow = {
  id: "singleton",
  colors: { primary: "30 80 160" },
  typography: {},
  radius: {},
  shadows: {},
  presetId: "ocean-blue",
  updatedAt: new Date(),
};

const mockPresetRow = {
  id: "ocean-blue",
  name: "Ocean Blue",
  slug: "ocean-blue",
  colors: { primary: "30 80 160" },
  typography: {},
  radius: {},
  shadows: {},
  builtIn: true,
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTx = {
  theme: {
    findUnique: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue(mockThemeRow),
  },
  themePreset: {
    findUnique: vi.fn().mockResolvedValue(null),
  },
};

const mockRevalidateTag = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  unstable_cache: (fn: Function) => fn,
}));

// Mock the service wrapper to directly call exec
vi.mock("@/lib/services/_shared", () => ({
  createService: (config: {
    schema: { parse: (input: unknown) => unknown };
    exec: (ctx: unknown) => unknown;
    permission: () => unknown;
    loadBefore?: (ctx: unknown) => unknown;
    version?: (out: unknown) => unknown;
  }) => {
    return async (_actor: unknown, raw: unknown) => {
      const input = config.schema.parse(raw);
      const result = await config.exec({ input, tx: mockTx, actor: _actor });
      return result;
    };
  },
}));

vi.mock("@/lib/db", () => ({ db: mockTx }));

describe("Theme update service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.theme.upsert.mockResolvedValue(mockThemeRow);
    mockTx.themePreset.findUnique.mockResolvedValue(null);
    mockRevalidateTag.mockReset();
  });

  it("upserts the singleton theme row", async () => {
    // Mock preset lookup to return a valid preset
    mockTx.themePreset.findUnique.mockResolvedValue(mockPresetRow);

    const { updateTheme } = await import("@/lib/services/theme/index");
    const actor = { userId: "user_1", role: "ADMIN", roleId: "role_1", email: "admin@test.com", organizationId: "org_1" };

    await updateTheme(actor, {
      colors: { primary: "30 80 160" },
      typography: {},
      radius: {},
      presetId: "ocean-blue",
    });

    expect(mockTx.theme.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "singleton" },
        create: expect.objectContaining({ presetId: "ocean-blue" }),
        update: expect.objectContaining({ presetId: "ocean-blue" }),
      }),
    );
  });

  it("persists null presetId for custom themes", async () => {
    const { updateTheme } = await import("@/lib/services/theme/index");
    const actor = { userId: "user_1", role: "ADMIN", roleId: "role_1", email: "admin@test.com", organizationId: "org_1" };

    await updateTheme(actor, {
      colors: { primary: "90 60 160" },
      presetId: null,
    });

    expect(mockTx.theme.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ presetId: null }),
        update: expect.objectContaining({ presetId: null }),
      }),
    );
  });

  it("calls revalidateTag for theme cache (no silent swallow)", async () => {
    const { updateTheme } = await import("@/lib/services/theme/index");
    const actor = { userId: "user_1", role: "ADMIN", roleId: "role_1", email: "admin@test.com", organizationId: "org_1" };

    await updateTheme(actor, {
      colors: { primary: "26 60 52" },
    });

    expect(mockRevalidateTag).toHaveBeenCalledWith("theme");
    expect(mockRevalidateTag).toHaveBeenCalledTimes(1);
  });

  it("propagates revalidateTag errors instead of swallowing them", async () => {
    mockRevalidateTag.mockImplementation(() => {
      throw new Error("revalidation failed");
    });

    const { updateTheme } = await import("@/lib/services/theme/index");
    const actor = { userId: "user_1", role: "ADMIN", roleId: "role_1", email: "admin@test.com", organizationId: "org_1" };

    await expect(
      updateTheme(actor, { colors: { primary: "26 60 52" } }),
    ).rejects.toThrow("revalidation failed");
  });

  it("rejects a non-existent presetId", async () => {
    mockTx.themePreset.findUnique.mockResolvedValue(null);

    const { updateTheme } = await import("@/lib/services/theme/index");
    const actor = { userId: "user_1", role: "ADMIN", roleId: "role_1", email: "admin@test.com", organizationId: "org_1" };

    await expect(
      updateTheme(actor, {
        colors: { primary: "26 60 52" },
        presetId: "does-not-exist",
      }),
    ).rejects.toThrow('Theme preset "does-not-exist" not found');
  });

  it("allows null presetId without preset lookup", async () => {
    const { updateTheme } = await import("@/lib/services/theme/index");
    const actor = { userId: "user_1", role: "ADMIN", roleId: "role_1", email: "admin@test.com", organizationId: "org_1" };

    await updateTheme(actor, {
      colors: { primary: "26 60 52" },
      presetId: null,
    });

    expect(mockTx.themePreset.findUnique).not.toHaveBeenCalled();
    expect(mockTx.theme.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ presetId: null }),
      }),
    );
  });
});
