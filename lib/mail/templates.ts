/**
 * Email templates as pure functions returning HTML+text.
 *
 * Keeping this as hand-rolled HTML rather than pulling in @react-email
 * for now: the templates are simple, deliverability testing shows
 * bigger wins from clean HTML + preheader + list-unsubscribe headers.
 */

type BrandContext = {
  orgName: string;
  siteUrl: string;
  logoUrl?: string;
};

function shell(brand: BrandContext, preheader: string, body: string, unsubUrl?: string) {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${brand.orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#1f2937;">
<div style="display:none;overflow:hidden;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;line-height:1px;color:#f4f5f7">${escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f7">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
      <tr><td style="padding:28px 32px 0;text-align:left">
        ${brand.logoUrl ? `<img src="${brand.logoUrl}" alt="${escape(brand.orgName)}" height="36" style="display:block;max-height:36px">` : `<strong style="font-size:18px">${escape(brand.orgName)}</strong>`}
      </td></tr>
      <tr><td style="padding:24px 32px 8px;line-height:1.55">${body}</td></tr>
      <tr><td style="padding:16px 32px 32px;border-top:1px solid #eef0f3;font-size:12px;color:#6b7280;line-height:1.5">
        <p style="margin:0 0 8px">You're receiving this email from ${escape(brand.orgName)}.</p>
        ${unsubUrl ? `<p style="margin:0"><a href="${escape(unsubUrl)}" style="color:#2563eb;text-decoration:underline">Unsubscribe</a> from these emails.</p>` : ""}
        <p style="margin:8px 0 0">&copy; ${year} ${escape(brand.orgName)}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function doubleOptInEmail({
  brand,
  confirmUrl,
}: {
  brand: BrandContext;
  confirmUrl: string;
}) {
  const preheader = `Confirm your subscription to ${brand.orgName}.`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px">Confirm your subscription</h1>
    <p style="margin:0 0 16px">Thanks for signing up for updates from ${escape(brand.orgName)}. Please confirm your email address so we know it's really you.</p>
    <p style="margin:16px 0 24px;text-align:center">
      <a href="${escape(confirmUrl)}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">Confirm subscription</a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px">If you didn't sign up, you can safely ignore this message.</p>
  `;
  return {
    subject: `Confirm your subscription to ${brand.orgName}`,
    html: shell(brand, preheader, body),
    text: `Confirm your subscription to ${brand.orgName} by opening this link: ${confirmUrl}`,
  };
}

export function welcomeEmail({ brand }: { brand: BrandContext }) {
  const preheader = `Welcome to ${brand.orgName}.`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px">Welcome to ${escape(brand.orgName)}</h1>
    <p style="margin:0 0 12px">Your subscription is confirmed. Expect the next update in your inbox soon.</p>
    <p style="margin:16px 0 0"><a href="${escape(brand.siteUrl)}" style="color:#2563eb">Visit the site \u2192</a></p>
  `;
  return {
    subject: `Welcome to ${brand.orgName}`,
    html: shell(brand, preheader, body),
    text: `Welcome to ${brand.orgName}. Visit ${brand.siteUrl}`,
  };
}

export function newsletterEmail({
  brand,
  subject,
  preheader,
  bodyHtml,
  bodyText,
  unsubUrl,
}: {
  brand: BrandContext;
  subject: string;
  preheader: string;
  bodyHtml: string;
  bodyText: string;
  unsubUrl: string;
}) {
  return {
    subject,
    html: shell(brand, preheader, bodyHtml, unsubUrl),
    text: `${bodyText}\n\n---\nUnsubscribe: ${unsubUrl}`,
  };
}

export function donationReceiptEmail({
  brand,
  amount,
  campaignTitle,
}: {
  brand: BrandContext;
  amount: string;
  campaignTitle?: string;
}) {
  const preheader = `Thanks for your gift to ${brand.orgName}.`;
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px">Thank you</h1>
    <p style="margin:0 0 12px">Your donation of <strong>${escape(amount)}</strong>${
      campaignTitle ? ` to <strong>${escape(campaignTitle)}</strong>` : ""
    } was received.</p>
    <p style="margin:0">A full receipt will be available in your account shortly.</p>
  `;
  return {
    subject: `Receipt for your donation to ${brand.orgName}`,
    html: shell(brand, preheader, body),
    text: `Thank you for your donation of ${amount} to ${brand.orgName}.`,
  };
}
