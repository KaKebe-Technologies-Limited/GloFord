import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "@/lib/blocks/sanitize";

describe("sanitizeHtml", () => {
  // ── Basic HTML passthrough ──
  it("preserves allowed tags", () => {
    expect(sanitizeHtml("<p>Hello</p>")).toBe("<p>Hello</p>");
    expect(sanitizeHtml("<strong>bold</strong>")).toBe("<strong>bold</strong>");
    expect(sanitizeHtml("<em>italic</em>")).toBe("<em>italic</em>");
    expect(sanitizeHtml("<u>underline</u>")).toBe("<u>underline</u>");
    expect(sanitizeHtml("<s>strike</s>")).toBe("<s>strike</s>");
    expect(sanitizeHtml("<br>")).toBe("<br>");
    expect(sanitizeHtml("<hr>")).toBe("<hr>");
  });

  it("preserves heading tags", () => {
    expect(sanitizeHtml("<h2>Title</h2>")).toBe("<h2>Title</h2>");
    expect(sanitizeHtml("<h3>Sub</h3>")).toBe("<h3>Sub</h3>");
    expect(sanitizeHtml("<h4>Small</h4>")).toBe("<h4>Small</h4>");
  });

  it("preserves list tags", () => {
    expect(sanitizeHtml("<ul><li>one</li></ul>")).toBe("<ul><li>one</li></ul>");
    expect(sanitizeHtml("<ol><li>one</li></ol>")).toBe("<ol><li>one</li></ol>");
  });

  it("preserves blockquote and code", () => {
    expect(sanitizeHtml("<blockquote>quote</blockquote>")).toBe("<blockquote>quote</blockquote>");
    expect(sanitizeHtml("<code>x = 1</code>")).toBe("<code>x = 1</code>");
    expect(sanitizeHtml("<pre>block</pre>")).toBe("<pre>block</pre>");
  });

  // ── Links ──
  it("preserves safe links with href", () => {
    const result = sanitizeHtml('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it("preserves mailto links", () => {
    const result = sanitizeHtml('<a href="mailto:test@example.com">email</a>');
    expect(result).toContain('href="mailto:test@example.com"');
  });

  it("preserves tel links", () => {
    const result = sanitizeHtml('<a href="tel:+1234567890">call</a>');
    expect(result).toContain('href="tel:+1234567890"');
  });

  it("preserves relative links", () => {
    const result = sanitizeHtml('<a href="/about">about</a>');
    expect(result).toContain('href="/about"');
  });

  // ── XSS Prevention ──
  it("strips script tags", () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).not.toContain("script");
    expect(sanitizeHtml("<script src=x></script>")).not.toContain("script");
  });

  it("strips style tags", () => {
    expect(sanitizeHtml("<style>body{display:none}</style>")).not.toContain("style");
  });

  it("strips iframe tags", () => {
    expect(sanitizeHtml('<iframe src="https://evil.com"></iframe>')).not.toContain("iframe");
  });

  it("strips object/embed/form/input tags", () => {
    expect(sanitizeHtml('<object data="x"></object>')).not.toContain("object");
    expect(sanitizeHtml('<embed src="x">')).not.toContain("embed");
    expect(sanitizeHtml('<form action="x"><input></form>')).not.toContain("form");
    expect(sanitizeHtml('<input type="text">')).not.toContain("input");
  });

  it("strips base/meta/link tags", () => {
    expect(sanitizeHtml('<base href="https://evil.com">')).not.toContain("base");
    expect(sanitizeHtml('<meta http-equiv="refresh">')).not.toContain("meta");
    expect(sanitizeHtml('<link rel="stylesheet" href="x">')).not.toContain("link");
  });

  it("strips inline event handlers (double quotes)", () => {
    const result = sanitizeHtml('<p onmouseover="alert(1)">hover</p>');
    expect(result).not.toContain("onmouseover");
    expect(result).not.toContain("alert");
  });

  it("strips inline event handlers (single quotes)", () => {
    const result = sanitizeHtml("<p onclick='alert(1)'>click</p>");
    expect(result).not.toContain("onclick");
  });

  it("strips javascript: URIs", () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">xss</a>');
    expect(result).not.toContain("javascript");
  });

  it("strips data: URIs", () => {
    const result = sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">xss</a>');
    expect(result).not.toContain("data:");
  });

  it("strips disallowed tags but keeps inner text", () => {
    expect(sanitizeHtml("<div>content</div>")).toBe("content");
    expect(sanitizeHtml("<span>text</span>")).toBe("text");
  });

  it("strips disallowed attributes on allowed tags", () => {
    const result = sanitizeHtml('<p style="color:red" class="x">text</p>');
    expect(result).toBe("<p>text</p>");
  });

  // ── Edge cases ──
  it("handles empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("handles plain text (no HTML)", () => {
    expect(sanitizeHtml("Hello world")).toBe("Hello world");
  });

  it("handles nested allowed tags", () => {
    expect(sanitizeHtml("<p><strong>bold <em>italic</em></strong></p>")).toBe(
      "<p><strong>bold <em>italic</em></strong></p>",
    );
  });

  it("handles mixed allowed and disallowed tags", () => {
    const input = '<div><p>keep</p><script>drop</script><strong>also keep</strong></div>';
    const result = sanitizeHtml(input);
    expect(result).toContain("<p>keep</p>");
    expect(result).toContain("<strong>also keep</strong>");
    expect(result).not.toContain("script");
    expect(result).not.toContain("div");
  });
});
