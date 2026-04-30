/**
 * Server-side HTML sanitization for richText blocks.
 *
 * Runs inside the richText service before persistence. We never trust
 * client-submitted HTML — admins can paste anything into the rich-text
 * editor and we must strip script/iframe/on* before it touches the DB.
 *
 * Using a hand-rolled allowlist to avoid pulling in DOMPurify + jsdom
 * at this scale; sufficient for block content which is prose-focused.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
  "h2", "h3", "h4", "blockquote", "code", "pre", "hr",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
};

const URL_SAFE = /^(https?:|mailto:|tel:|\/)/i;

export function sanitizeHtml(input: string): string {
  // Drop script/style/dangerous blocks entirely
  // Note: regex patterns below are HTML sanitization, not shell commands (not CWE-78)
  let out = input.replace(/<\/?(script|style|iframe|object|embed|form|input|base|meta|link)[^>]*>/gi, "");
  out = out.replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/ on[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/javascript:/gi, "");
  out = out.replace(/data:/gi, ""); // strip data: URIs which can carry XSS

  // Strip disallowed tags (keep inner text)
  out = out.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag: string, attrs: string) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return "";
    if (match.startsWith("</")) return `</${lower}>`;

    const allowed = ALLOWED_ATTRS[lower];
    if (!allowed) return `<${lower}>`;

    const cleaned: string[] = [];
    const attrRegex = /([a-z-]+)\s*=\s*"([^"]*)"/gi;
    let m;
    while ((m = attrRegex.exec(attrs))) {
      const name = m[1];
      const value = m[2];
      if (!name || value === undefined) continue;
      if (!allowed.has(name.toLowerCase())) continue;
      if (name.toLowerCase() === "href" && !URL_SAFE.test(value)) continue;
      cleaned.push(`${name}="${escapeAttr(value)}"`);
    }
    if (lower === "a") cleaned.push('rel="noopener noreferrer"');
    return cleaned.length ? `<${lower} ${cleaned.join(" ")}>` : `<${lower}>`;
  });

  return out;
}

function escapeAttr(v: string): string {
  return v.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
