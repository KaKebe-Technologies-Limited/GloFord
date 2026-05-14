import { describe, expect, it } from "vitest";
import { mediaFinalizeSchema, mediaPresignSchema } from "@/lib/validators/media";
import { buildMediaKey } from "@/lib/storage/r2";

describe("mediaPresignSchema", () => {
  it("accepts valid image metadata", () => {
    const result = mediaPresignSchema.safeParse({
      name: "photo.jpg",
      mime: "image/jpeg",
      size: 1024 * 1024,
    });
    expect(result.success).toBe(true);
  });

  it("accepts PDF uploads", () => {
    const result = mediaPresignSchema.safeParse({
      name: "report.pdf",
      mime: "application/pdf",
      size: 5 * 1024 * 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects unsupported file types", () => {
    const result = mediaPresignSchema.safeParse({
      name: "script.js",
      mime: "application/javascript",
      size: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects files over 25 MB", () => {
    const result = mediaPresignSchema.safeParse({
      name: "huge.png",
      mime: "image/png",
      size: 26 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
  });

  it("accepts files at exactly 25 MB", () => {
    const result = mediaPresignSchema.safeParse({
      name: "big.png",
      mime: "image/png",
      size: 25 * 1024 * 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = mediaPresignSchema.safeParse({
      name: "",
      mime: "image/png",
      size: 1024,
    });
    expect(result.success).toBe(false);
  });
});

describe("mediaFinalizeSchema", () => {
  it("accepts valid finalize payload", () => {
    const result = mediaFinalizeSchema.safeParse({
      key: "1234567890-abcd1234-photo.jpg",
      mime: "image/jpeg",
      sizeBytes: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional width/height/alt", () => {
    const result = mediaFinalizeSchema.safeParse({
      key: "1234567890-abcd1234-photo.jpg",
      mime: "image/jpeg",
      sizeBytes: 1024,
      width: 800,
      height: 600,
      alt: "A beautiful sunset",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing key", () => {
    const result = mediaFinalizeSchema.safeParse({
      mime: "image/jpeg",
      sizeBytes: 1024,
    });
    expect(result.success).toBe(false);
  });
});

describe("buildMediaKey", () => {
  it("generates a key with timestamp prefix", () => {
    const key = buildMediaKey("My Photo.jpg");
    expect(key).toMatch(/^\d+-[a-f0-9]{8}-my-photo.jpg$/);
  });

  it("sanitises special characters", () => {
    const key = buildMediaKey("Hello World (Final) [v2].png");
    expect(key).not.toMatch(/[\s()[\]]/);
    expect(key).toMatch(/\.png$/);
  });

  it("truncates long filenames to 80 chars", () => {
    const longName = "a".repeat(200) + ".png";
    const key = buildMediaKey(longName);
    // Key format: timestamp-uuid-filename (filename max 80)
    const parts = key.split("-");
    const filename = parts.slice(2).join("-");
    expect(filename.length).toBeLessThanOrEqual(80);
  });

  it("generates unique keys for the same filename", () => {
    const key1 = buildMediaKey("photo.jpg");
    const key2 = buildMediaKey("photo.jpg");
    expect(key1).not.toBe(key2);
  });
});
