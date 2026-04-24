import { inngest } from "../client";
import { getMailProvider } from "@/lib/mail";
import { buildBrand } from "@/lib/mail/brand";
import { userInviteEmail } from "@/lib/mail/templates";

export const userInviteSend = inngest.createFunction(
  { id: "user-invite-send", retries: 3 },
  { event: "user/invite.send" },
  async ({ event, step }) => {
    const { email, name } = event.data;
    const brand = await step.run("load-brand", () => buildBrand());
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
        metadata: { type: "user-invite", email },
      }),
    );
    return { sent: true };
  },
);
