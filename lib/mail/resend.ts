import { Resend } from "resend";
import { UpstreamError } from "@/lib/errors";
import type { MailProvider, SendEmailParams, SendEmailResult } from "./types";

let client: Resend | null = null;
function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new UpstreamError("RESEND_API_KEY is not set");
  if (!client) client = new Resend(key);
  return client;
}

export const resendProvider: MailProvider = {
  id: "resend",
  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const from = process.env.MAIL_FROM ?? "Gloford <no-reply@gloford.org>";
    const res = await getClient().emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      tags: params.metadata
        ? Object.entries(params.metadata).map(([name, value]) => ({ name, value }))
        : undefined,
    });
    if (res.error) throw new UpstreamError(`Resend: ${res.error.message}`);
    return { providerMessageId: res.data?.id ?? null };
  },
};
