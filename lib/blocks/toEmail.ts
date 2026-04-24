import { blocksSchema, type Block } from "./types";

/**
 * Flatten the block array into email-safe HTML and plain text.
 *
 * Keeps things minimal for deliverability: no CSS grids, no custom
 * fonts, basic tables where layout matters. The public website renders
 * blocks with full styling; the email version is a degraded but valid
 * representation of the same content.
 */

export function blocksToEmailHtml(raw: unknown): string {
  const parsed = blocksSchema.safeParse(raw);
  if (!parsed.success) return "";
  return parsed.data.map(renderHtml).join("\n");
}

export function blocksToPlainText(raw: unknown): string {
  const parsed = blocksSchema.safeParse(raw);
  if (!parsed.success) return "";
  return parsed.data.map(renderText).join("\n\n");
}

function renderHtml(b: Block): string {
  switch (b.type) {
    case "hero":
      return `
        <h1 style="font-size:22px;margin:0 0 10px;color:#111827">${escape(b.data.heading)}</h1>
        ${b.data.subheading ? `<p style="margin:0 0 12px;color:#4b5563">${escape(b.data.subheading)}</p>` : ""}
        ${
          b.data.ctaLabel && b.data.ctaHref
            ? `<p style="margin:16px 0"><a href="${escape(b.data.ctaHref)}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#ffffff;border-radius:6px;text-decoration:none">${escape(b.data.ctaLabel)}</a></p>`
            : ""
        }
      `;
    case "richText":
      // Already sanitized when stored via the content service.
      return `<div style="line-height:1.6">${b.data.html}</div>`;
    case "cta":
      return `
        <h2 style="font-size:18px;margin:24px 0 8px">${escape(b.data.heading)}</h2>
        ${b.data.body ? `<p style="margin:0 0 12px;color:#4b5563">${escape(b.data.body)}</p>` : ""}
        <p style="margin:12px 0"><a href="${escape(b.data.buttonHref)}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#ffffff;border-radius:6px;text-decoration:none">${escape(b.data.buttonLabel)}</a></p>
      `;
    case "stats":
      return `
        ${b.data.heading ? `<h2 style="font-size:18px;margin:24px 0 8px">${escape(b.data.heading)}</h2>` : ""}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0"><tr>${b.data.items
          .map(
            (it) => `
          <td style="padding:8px;text-align:center">
            <div style="font-size:22px;font-weight:700">${escape(it.value)}</div>
            <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">${escape(it.label)}</div>
          </td>
        `,
          )
          .join("")}</tr></table>
      `;
    case "donateCta":
      return `
        <h2 style="font-size:18px;margin:24px 0 8px">${escape(b.data.heading)}</h2>
        ${b.data.body ? `<p style="margin:0 0 12px;color:#4b5563">${escape(b.data.body)}</p>` : ""}
        <p style="margin:12px 0"><a href="/donate${b.data.campaignSlug ? "/" + escape(b.data.campaignSlug) : ""}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#ffffff;border-radius:6px;text-decoration:none">${escape(b.data.buttonLabel)}</a></p>
      `;
    case "gallery":
    case "programGrid":
    case "postList":
    case "featureSplit":
    case "actionCards":
    case "eventList":
    case "partnerLogos":
      // Email-unsuitable blocks collapse to a heading + link back to site.
      return `<p style="margin:12px 0;color:#6b7280">See more on our site.</p>`;
    default:
      return "";
  }
}

function renderText(b: Block): string {
  switch (b.type) {
    case "hero":
      return `${b.data.heading}\n${b.data.subheading ?? ""}`;
    case "richText":
      return stripTags(b.data.html);
    case "cta":
      return `${b.data.heading}\n${b.data.body ?? ""}\n${b.data.buttonLabel}: ${b.data.buttonHref}`;
    case "stats":
      return `${b.data.heading ?? ""}\n${b.data.items.map((it) => `${it.value} ${it.label}`).join(" · ")}`;
    case "donateCta":
      return `${b.data.heading}\n${b.data.body ?? ""}`;
    default:
      return "";
  }
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
