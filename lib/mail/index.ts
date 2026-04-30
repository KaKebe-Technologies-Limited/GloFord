import type { MailProvider } from "./types";
import { resendProvider } from "./resend";
import { smtpProvider } from "./smtp";

/**
 * No-op provider used when neither SMTP nor Resend is configured.
 * Logs the mail to the console so admin flows stay usable in dev.
 */
const logProvider: MailProvider = {
  id: "log",
  async send(params) {
    console.info("[mail/dry-run]", { to: params.to, subject: params.subject, metadata: params.metadata });
    return { providerMessageId: null, dryRun: true };
  },
};

/**
 * Priority: SMTP_HOST (self-hosted) > RESEND_API_KEY (SaaS) > log (dev fallback).
 */
export function getMailProvider(): MailProvider {
  if (process.env.SMTP_HOST) return smtpProvider;
  if (process.env.RESEND_API_KEY) return resendProvider;
  return logProvider;
}

export type { SendEmailParams, SendEmailResult, MailProvider } from "./types";
