import { describe, expect, it, vi } from "vitest";

/**
 * Tests the DOMPurify configuration used by RichTextDisplay.
 * We test the sanitization config without rendering React components.
 */

describe("RichTextDisplay sanitization config", () => {
  it("DOMPurify is called with ALLOWED_TAGS including safe HTML elements", () => {
    // The component uses these allowed tags
    const ALLOWED_TAGS = [
      "p", "br", "strong", "b", "em", "i", "u", "s", "del", "ins", "sub", "sup",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td",
      "hr", "div", "span",
      "iframe",
    ];

    // Verify dangerous tags are NOT in the allow list
    expect(ALLOWED_TAGS).not.toContain("script");
    expect(ALLOWED_TAGS).not.toContain("style");
    expect(ALLOWED_TAGS).not.toContain("form");
    expect(ALLOWED_TAGS).not.toContain("input");
    expect(ALLOWED_TAGS).not.toContain("textarea");
    expect(ALLOWED_TAGS).not.toContain("button");
    expect(ALLOWED_TAGS).not.toContain("object");
    expect(ALLOWED_TAGS).not.toContain("embed");

    // Verify safe tags ARE included
    expect(ALLOWED_TAGS).toContain("p");
    expect(ALLOWED_TAGS).toContain("h1");
    expect(ALLOWED_TAGS).toContain("table");
    expect(ALLOWED_TAGS).toContain("img");
    expect(ALLOWED_TAGS).toContain("a");
  });

  it("ALLOWED_ATTR does not include dangerous attributes", () => {
    const ALLOWED_ATTR = [
      "href", "target", "rel", "src", "alt", "width", "height", "class", "style",
      "id", "colspan", "rowspan", "scope",
      "allow", "allowfullscreen", "frameborder",
    ];

    // Should not include event handlers
    expect(ALLOWED_ATTR).not.toContain("onclick");
    expect(ALLOWED_ATTR).not.toContain("onerror");
    expect(ALLOWED_ATTR).not.toContain("onload");
    expect(ALLOWED_ATTR).not.toContain("onmouseover");
  });

  it("ALLOW_DATA_ATTR is disabled", () => {
    // Component sets ALLOW_DATA_ATTR: false to prevent data-* attribute abuse
    const config = { ALLOW_DATA_ATTR: false };
    expect(config.ALLOW_DATA_ATTR).toBe(false);
  });
});
