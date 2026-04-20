import { auditLog } from "./audit-log";
import { versioningSnapshot } from "./versioning-snapshot";
import { deadletterEnqueue } from "./deadletter-enqueue";

/** The array Inngest's Next.js handler registers. Add new functions here. */
export const functions = [auditLog, versioningSnapshot, deadletterEnqueue];
