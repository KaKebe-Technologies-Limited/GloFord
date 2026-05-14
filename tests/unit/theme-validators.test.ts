import { describe, expect, it } from "vitest";
import { themeUpdateSchema } from "@/lib/validators/theme";

describe("themeUpdateSchema", () => {
  it("accepts a full theme payload with all groups", () => {
    const result = themeUpdateSchema.safeParse({
      colors: { primary: "26 60 52", "primary-fg": "255 255 255" },
      typography: { sans: "'Inter', sans-serif" },
      radius: { md: "0.5rem" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty groups (defaults to empty objects)", () => {
    const result = themeUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.colors).toEqual({});
      expect(result.data.typography).toEqual({});
      expect(result.data.radius).toEqual({});
    }
  });

  it("accepts presetId as a string", () => {
    const result = themeUpdateSchema.safeParse({
      colors: { primary: "30 80 160" },
      presetId: "ocean-blue",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.presetId).toBe("ocean-blue");
    }
  });

  it("accepts presetId as null (custom theme)", () => {
    const result = themeUpdateSchema.safeParse({
      colors: { primary: "90 60 160" },
      presetId: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.presetId).toBeNull();
    }
  });

  it("defaults missing presetId to null", () => {
    const result = themeUpdateSchema.safeParse({
      colors: { primary: "26 60 52" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.presetId).toBeNull();
    }
  });

  it("rejects invalid RGB triplets (out of range)", () => {
    const result = themeUpdateSchema.safeParse({
      colors: { primary: "256 0 0" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-RGB color values", () => {
    const result = themeUpdateSchema.safeParse({
      colors: { primary: "red" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects hex color values", () => {
    const result = themeUpdateSchema.safeParse({
      colors: { primary: "#ff0000" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid RGB triplets at bounds", () => {
    const result = themeUpdateSchema.safeParse({
      colors: { bg: "0 0 0", fg: "255 255 255" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects radius values without CSS units", () => {
    const result = themeUpdateSchema.safeParse({
      radius: { md: "0.5" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts radius values with CSS units", () => {
    const result = themeUpdateSchema.safeParse({
      radius: { sm: "0.25rem", md: "8px", lg: "1em" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty token values", () => {
    const result = themeUpdateSchema.safeParse({
      typography: { sans: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid token keys", () => {
    const result = themeUpdateSchema.safeParse({
      colors: { "INVALID KEY!": "255 0 0" },
    });
    expect(result.success).toBe(false);
  });
});
