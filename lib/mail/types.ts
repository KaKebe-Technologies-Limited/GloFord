/**
 * MailProvider: thin interface so we can swap Resend for SES without
 * touching call sites. The implementation is responsible for
 * delivery + returning a provider message id we can persist.
 */

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Tag/metadata used by the provider's webhook to correlate with our DB rows. */
  metadata?: Record<string, string>;
};

export type SendEmailResult = {
  providerMessageId: string | null;
  /** Fallback flag when no provider is configured; mail is logged, not sent. */
  dryRun?: boolean;
};

export interface MailProvider {
  readonly id: "resend" | "smtp" | "log";
  send(params: SendEmailParams): Promise<SendEmailResult>;
}
