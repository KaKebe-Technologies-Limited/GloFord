import { createTransport, type Transporter } from "nodemailer";
import type { MailProvider, SendEmailParams, SendEmailResult } from "./types";

let transport: Transporter | null = null;

function getTransport(): Transporter {
  if (!transport) {
    transport = createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      ...(process.env.SMTP_USER && {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS ?? "",
        },
      }),
    });
  }
  return transport;
}

export const smtpProvider: MailProvider = {
  id: "smtp",
  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const from = process.env.MAIL_FROM ?? "Gloford <no-reply@gloford.org>";
    const info = await getTransport().sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      headers: params.metadata
        ? { "X-Metadata": JSON.stringify(params.metadata) }
        : undefined,
    });
    return { providerMessageId: info.messageId ?? null };
  },
};
