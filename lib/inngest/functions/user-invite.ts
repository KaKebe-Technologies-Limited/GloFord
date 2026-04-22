import { inngest } from "../client";
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { userInviteEmail } from "@/lib/mail/templates";

/**
 * Sends the invite email when a new member is added via the Users admin.
 * The inviteUser service creates the membership and emits this event —
 * we keep the send out-of-band so a slow Resend response doesn't block
 * the admin UI.
 */
export const userInviteSend = inngest.createFunction(
  { id: "user-invite-send", retries: 3 },
  { event: "user/invite.send" },
  async ({ event, step }) => {
    const { orgId, email, name } = event.data;
    const brand = await step.run("load-brand", () => buildBrand(orgId));
    const mail = userInviteEmail({
      brand,
      inviteeName: name,
      signInUrl: `${brand.siteUrl}/login`,
    });
    const provider = getMailProvider();
    await step.run("send", () =>
      provider.send({
        to: email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        metadata: { type: "user-invite", orgId, email },
      }),
    );
    return { sent: true };
  },
);
