import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories must not reference top-level variables
vi.mock("@/lib/db", () => ({
  db: {
    theme: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock("@/lib/cache", () => ({ tags: { theme: () => "theme" } }));

import { getActiveThemeTokens } from "@/lib/theme/service";
import { db } from "@/lib/db";

const mockFindUnique = vi.mocked(db.theme.findUnique);

describe("getActiveThemeTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns DEFAULTS when no theme row exists", async () => {
    mockFindUnique.mockResolvedValue(null);
    const tokens = await getActiveThemeTokens();
    expect(tokens.primary).toBe("26 60 52");
    expect(tokens["primary-fg"]).toBe("255 255 255");
    expect(tokens.bg).toBe("255 255 255");
    expect(tokens.fg).toBe("10 10 11");
    expect(tokens["success-fg"]).toBe("255 255 255");
  });

  it("merges DB colors over defaults", async () => {
    mockFindUnique.mockResolvedValue({
      id: "singleton",
      colors: { primary: "100 200 50", accent: "50 100 200" },
      typography: {},
      radius: {},
      shadows: {},
      custom: null,
      presetId: null,
      updatedAt: new Date(),
    });
    const tokens = await getActiveThemeTokens();
    expect(tokens.primary).toBe("100 200 50");
    expect(tokens.accent).toBe("50 100 200");
    expect(tokens.bg).toBe("255 255 255");
  });

  it("merges DB typography with font- prefix", async () => {
    mockFindUnique.mockResolvedValue({
      id: "singleton",
      colors: {},
      typography: { sans: "'Custom Font', sans-serif" },
      radius: {},
      shadows: {},
      custom: null,
      presetId: null,
      updatedAt: new Date(),
    });
    const tokens = await getActiveThemeTokens();
    expect(tokens["font-sans"]).toBe("'Custom Font', sans-serif");
    expect(tokens["font-serif"]).toContain("Playfair");
  });

  it("merges DB radius with radius- prefix", async () => {
    mockFindUnique.mockResolvedValue({
      id: "singleton",
      colors: {},
      typography: {},
      radius: { md: "1rem", lg: "2rem" },
      shadows: {},
      custom: null,
      presetId: null,
      updatedAt: new Date(),
    });
    const tokens = await getActiveThemeTokens();
    expect(tokens["radius-md"]).toBe("1rem");
    expect(tokens["radius-lg"]).toBe("2rem");
    expect(tokens["radius-sm"]).toBe("0.25rem");
  });

  it("skips shadows (not processed)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "singleton",
      colors: {},
      typography: {},
      radius: {},
      shadows: { sm: "0 1px 2px rgba(0,0,0,0.1)" },
      custom: null,
      presetId: null,
      updatedAt: new Date(),
    });
    const tokens = await getActiveThemeTokens();
    expect(tokens["shadow-sm"]).toBeUndefined();
  });

  it("returns DEFAULTS on DB error", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB down"));
    const tokens = await getActiveThemeTokens();
    expect(tokens.primary).toBe("26 60 52");
  });

  it("ignores non-string values in DB theme", async () => {
    mockFindUnique.mockResolvedValue({
      id: "singleton",
      colors: { primary: "100 100 100", broken: 42, nested: { bad: true } },
      typography: {},
      radius: {},
      shadows: {},
      custom: null,
      presetId: null,
      updatedAt: new Date(),
    });
    const tokens = await getActiveThemeTokens();
    expect(tokens.primary).toBe("100 100 100");
    expect(tokens["broken" as string]).toBeUndefined();
  });
});
