import { describe, expect, it } from "vitest";
import { postCreateSchema } from "@/lib/validators/posts";
import { programCreateSchema } from "@/lib/validators/programs";
import { eventCreateSchema } from "@/lib/validators/events";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const str = (len: number) => "x".repeat(len);

// ---------------------------------------------------------------------------
// postCreateSchema — SEO fields
// ---------------------------------------------------------------------------

describe("postCreateSchema — SEO fields", () => {
  const base = {
    slug: "my-post",
    title: "My Post",
  };

  it("accepts a valid post with no SEO fields", () => {
    const result = postCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("accepts seoTitle at exactly 200 chars", () => {
    const result = postCreateSchema.safeParse({ ...base, seoTitle: str(200) });
    expect(result.success).toBe(true);
  });

  it("rejects seoTitle over 200 chars", () => {
    const result = postCreateSchema.safeParse({ ...base, seoTitle: str(201) });
    expect(result.success).toBe(false);
  });

  it("accepts seoDesc at exactly 400 chars", () => {
    const result = postCreateSchema.safeParse({ ...base, seoDesc: str(400) });
    expect(result.success).toBe(true);
  });

  it("rejects seoDesc over 400 chars", () => {
    const result = postCreateSchema.safeParse({ ...base, seoDesc: str(401) });
    expect(result.success).toBe(false);
  });

  it("accepts null for seoTitle and seoDesc", () => {
    const result = postCreateSchema.safeParse({
      ...base,
      seoTitle: null,
      seoDesc: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = postCreateSchema.safeParse({ slug: "my-post" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug (spaces)", () => {
    const result = postCreateSchema.safeParse({ slug: "my post", title: "My Post" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// programCreateSchema — SEO fields
// ---------------------------------------------------------------------------

describe("programCreateSchema — SEO fields", () => {
  const base = {
    slug: "youth-program",
    title: "Youth Program",
    summary: "A program for youth.",
  };

  it("accepts a valid program with no SEO fields", () => {
    const result = programCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("accepts seoTitle at exactly 200 chars", () => {
    const result = programCreateSchema.safeParse({ ...base, seoTitle: str(200) });
    expect(result.success).toBe(true);
  });

  it("rejects seoTitle over 200 chars", () => {
    const result = programCreateSchema.safeParse({ ...base, seoTitle: str(201) });
    expect(result.success).toBe(false);
  });

  it("accepts seoDesc at exactly 400 chars", () => {
    const result = programCreateSchema.safeParse({ ...base, seoDesc: str(400) });
    expect(result.success).toBe(true);
  });

  it("rejects seoDesc over 400 chars", () => {
    const result = programCreateSchema.safeParse({ ...base, seoDesc: str(401) });
    expect(result.success).toBe(false);
  });

  it("accepts null for seoTitle and seoDesc", () => {
    const result = programCreateSchema.safeParse({
      ...base,
      seoTitle: null,
      seoDesc: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing summary", () => {
    const result = programCreateSchema.safeParse({ slug: "youth-program", title: "Youth Program" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// eventCreateSchema — SEO fields
// ---------------------------------------------------------------------------

describe("eventCreateSchema — SEO fields", () => {
  const base = {
    slug: "spring-gala",
    title: "Spring Gala",
    description: "Our annual fundraiser.",
    startsAt: new Date("2026-07-01T18:00:00Z"),
  };

  it("accepts a valid event with no SEO fields", () => {
    const result = eventCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("accepts seoTitle at exactly 200 chars", () => {
    const result = eventCreateSchema.safeParse({ ...base, seoTitle: str(200) });
    expect(result.success).toBe(true);
  });

  it("rejects seoTitle over 200 chars", () => {
    const result = eventCreateSchema.safeParse({ ...base, seoTitle: str(201) });
    expect(result.success).toBe(false);
  });

  it("accepts seoDesc at exactly 400 chars", () => {
    const result = eventCreateSchema.safeParse({ ...base, seoDesc: str(400) });
    expect(result.success).toBe(true);
  });

  it("rejects seoDesc over 400 chars", () => {
    const result = eventCreateSchema.safeParse({ ...base, seoDesc: str(401) });
    expect(result.success).toBe(false);
  });

  it("accepts null for seoTitle and seoDesc", () => {
    const result = eventCreateSchema.safeParse({
      ...base,
      seoTitle: null,
      seoDesc: null,
    });
    expect(result.success).toBe(true);
  });
});
