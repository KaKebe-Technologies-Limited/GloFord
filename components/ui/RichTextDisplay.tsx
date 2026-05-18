"use client";

import DOMPurify from "dompurify";

type RichTextDisplayProps = {
  html: string;
  className?: string;
};

export function RichTextDisplay({ html, className }: RichTextDisplayProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "del", "ins", "sub", "sup",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td",
      "hr", "div", "span",
      "iframe",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "src", "alt", "width", "height", "class", "style",
      "id", "colspan", "rowspan", "scope",
      "allow", "allowfullscreen", "frameborder",
    ],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
