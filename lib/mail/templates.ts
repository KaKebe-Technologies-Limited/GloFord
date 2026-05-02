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

function shell(brand: BrandContext, preheader: string, body: string, unsubUrl?: string, prefsUrl?: string) {
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
        ${unsubUrl ? `<p style="margin:0"><a href="${escape(unsubUrl)}" style="color:#2563eb;text-decoration:underline">Unsubscribe</a>${prefsUrl ? ` &middot; <a href="${escape(prefsUrl)}" style="color:#2563eb;text-decoration:underline">Manage preferences</a>` : ""}</p>` : ""}
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
  prefsUrl,
}: {
  brand: BrandContext;
  subject: string;
  preheader: string;
  bodyHtml: string;
  bodyText: string;
  unsubUrl: string;
  prefsUrl?: string;
}) {
  return {
    subject,
    html: shell(brand, preheader, bodyHtml, unsubUrl, prefsUrl),
    text: `${bodyText}\n\n---\nUnsubscribe: ${unsubUrl}${prefsUrl ? `\nManage preferences: ${prefsUrl}` : ""}`,
  };
}

export function userInviteEmail({
  brand,
  inviteeName,
  signInUrl,
}: {
  brand: BrandContext;
  inviteeName?: string;
  signInUrl: string;
}) {
  const preheader = `You've been invited to ${brand.orgName}'s admin.`;
  const greet = inviteeName ? `Hi ${escape(inviteeName)},` : "Hello,";
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px">Welcome to ${escape(brand.orgName)}</h1>
    <p style="margin:0 0 12px">${greet} an administrator added you to the ${escape(brand.orgName)} admin workspace.</p>
    <p style="margin:0 0 16px">Sign in with this email to get started. If you haven't set a password, use the "Sign in with Google" option or request a magic link on the sign-in page.</p>
    <p style="margin:16px 0 0;text-align:center">
      <a href="${escape(signInUrl)}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">Sign in</a>
    </p>
  `;
  return {
    subject: `You've been invited to ${brand.orgName}`,
    html: shell(brand, preheader, body),
    text: `${greet}\n\nYou've been invited to ${brand.orgName}'s admin workspace.\nSign in: ${signInUrl}`,
  };
}

export function eventNotificationEmail({
  brand,
  subject,
  kind,
  eventTitle,
  eventStartsAt,
  eventLocation,
  eventUrl,
  bodyHtml,
  bodyText,
  unsubUrl,
}: {
  brand: BrandContext;
  subject: string;
  kind: "ANNOUNCEMENT" | "REMINDER";
  eventTitle: string;
  eventStartsAt: Date;
  eventLocation?: string;
  eventUrl: string;
  bodyHtml: string;
  bodyText: string;
  unsubUrl: string;
}) {
  const when = eventStartsAt.toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
  const badge = kind === "REMINDER" ? "Reminder" : "Announcement";
  const preheader = `${badge}: ${eventTitle} — ${when}`;
  const header = `
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280">${badge}</p>
    <h1 style="font-size:22px;margin:0 0 12px">${escape(eventTitle)}</h1>
    <p style="margin:0 0 4px;color:#374151"><strong>When:</strong> ${escape(when)}</p>
    ${eventLocation ? `<p style="margin:0 0 16px;color:#374151"><strong>Where:</strong> ${escape(eventLocation)}</p>` : ""}
  `;
  const cta = `
    <p style="margin:20px 0 0;text-align:center">
      <a href="${escape(eventUrl)}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">View event details</a>
    </p>
  `;
  const plain = `${badge}: ${eventTitle}\n${when}${eventLocation ? `\n${eventLocation}` : ""}\n\n${bodyText}\n\nDetails: ${eventUrl}`;
  return {
    subject,
    html: shell(brand, preheader, `${header}${bodyHtml || ""}${cta}`, unsubUrl),
    text: `${plain}\n\n---\nUnsubscribe: ${unsubUrl}`,
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
