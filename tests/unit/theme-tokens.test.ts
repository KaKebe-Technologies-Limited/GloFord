import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Tests the theme token merging logic that loadActiveTheme uses to
 * combine DB values with hardcoded defaults and apply key prefixes.
 */

const mockDb = {
  theme: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ db: mockDb }));
// Stub Next.js cache utilities that aren't available in test
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

describe("Theme token loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns defaults when no theme row exists", async () => {
    mockDb.theme.findUnique.mockResolvedValue(null);

    const { getActiveThemeTokens } = await import("@/lib/theme/service");
    const tokens = await getActiveThemeTokens();

    expect(tokens).toHaveProperty("primary");
    expect(tokens).toHaveProperty("bg");
    expect(tokens).toHaveProperty("font-sans");
    expect(tokens).toHaveProperty("radius-md");
    expect(tokens.primary).toBe("26 60 52");
  });

  it("merges DB colors over defaults without prefix", async () => {
    mockDb.theme.findUnique.mockResolvedValue({
      id: "singleton",
      colors: { primary: "30 80 160", accent: "14 130 200" },
      typography: {},
      radius: {},
      shadows: {},
    });

    const { getActiveThemeTokens } = await import("@/lib/theme/service");
    const tokens = await getActiveThemeTokens();

    expect(tokens.primary).toBe("30 80 160");
    expect(tokens.accent).toBe("14 130 200");
    // Defaults still present for unset keys
    expect(tokens.bg).toBe("255 255 255");
  });

  it("prefixes typography keys with font-", async () => {
    mockDb.theme.findUnique.mockResolvedValue({
      id: "singleton",
      colors: {},
      typography: { sans: "'Custom Font', sans-serif" },
      radius: {},
      shadows: {},
    });

    const { getActiveThemeTokens } = await import("@/lib/theme/service");
    const tokens = await getActiveThemeTokens();

    expect(tokens["font-sans"]).toBe("'Custom Font', sans-serif");
  });

  it("prefixes radius keys with radius-", async () => {
    mockDb.theme.findUnique.mockResolvedValue({
      id: "singleton",
      colors: {},
      typography: {},
      radius: { md: "1rem", lg: "2rem" },
      shadows: {},
    });

    const { getActiveThemeTokens } = await import("@/lib/theme/service");
    const tokens = await getActiveThemeTokens();

    expect(tokens["radius-md"]).toBe("1rem");
    expect(tokens["radius-lg"]).toBe("2rem");
  });

  it("returns defaults on DB error", async () => {
    mockDb.theme.findUnique.mockRejectedValue(new Error("DB down"));

    const { getActiveThemeTokens } = await import("@/lib/theme/service");
    const tokens = await getActiveThemeTokens();

    // Fallback to defaults
    expect(tokens.primary).toBe("26 60 52");
    expect(tokens.bg).toBe("255 255 255");
  });
});
