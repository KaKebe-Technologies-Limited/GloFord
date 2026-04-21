import type { MailProvider } from "./types";
import { resendProvider } from "./resend";

/**
 * No-op provider used when RESEND_API_KEY isn't set. Logs the mail
 * to the console; callers treat a `dryRun` result the same as a send.
 * Keeps admin flows usable in dev without a mail account.
 */
const logProvider: MailProvider = {
  id: "log",
  async send(params) {
    console.info("[mail/dry-run]", { to: params.to, subject: params.subject, metadata: params.metadata });
    return { providerMessageId: null, dryRun: true };
  },
};

export function getMailProvider(): MailProvider {
  if (process.env.RESEND_API_KEY) return resendProvider;
  return logProvider;
}

export type { SendEmailParams, SendEmailResult, MailProvider } from "./types";
