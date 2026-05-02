import { auditLog } from "./audit-log";
import { versioningSnapshot } from "./versioning-snapshot";
import { deadletterEnqueue } from "./deadletter-enqueue";
import { donationTagDonor } from "./donation-tag-donor";
import { newsletterSend } from "./newsletter-send";
import { eventAnnounceSend, eventReminderSend } from "./event-notification-send";
import { enrollOnSignup, enrollOnDonation } from "./campaign-enroll";
import { campaignStepRunner } from "./campaign-step-runner";
import {
  scheduledNewsletterDispatch,
  scheduledEventNotificationDispatch,
} from "./scheduled-dispatch";
import { versionRestoreApply } from "./version-restore";
import { userInviteSend } from "./user-invite";
import { eventAutoReminder } from "./event-auto-reminder";

/** The array Inngest's Next.js handler registers. Add new functions here. */
export const functions = [
  // Observability
  auditLog,
  versioningSnapshot,
  deadletterEnqueue,
  // Domain flows
  donationTagDonor,
  newsletterSend,
  eventAnnounceSend,
  eventReminderSend,
  eventAutoReminder,
  // Drip automation
  enrollOnSignup,
  enrollOnDonation,
  campaignStepRunner,
  // Scheduled dispatchers
  scheduledNewsletterDispatch,
  scheduledEventNotificationDispatch,
  // Admin flows
  versionRestoreApply,
  userInviteSend,
];
