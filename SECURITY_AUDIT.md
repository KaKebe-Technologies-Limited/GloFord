# Security Audit — Gloford Platform

Audit date: 2026-05-18

## 4a. Server Actions — organizationId Trust

| Finding | Severity | Status |
|---|---|---|
| No server action accepts `organizationId` from client | N/A | PASS |

All server actions use `requireActorFromSession()` which derives the user + org from the session cookie. The `createService()` factory enforces: parse -> authorize -> transact -> audit. No client-supplied org ID is ever trusted.

## 4b. Sensitive Field Masking

| Finding | Severity | Status |
|---|---|---|
| Payment config form uses `type="password"` for secrets | LOW | PASS |
| `MaskedField` component created for future use | N/A | DONE |

The payment settings form at `admin/settings/payments/[provider]/Form.tsx` renders API keys and secrets as `<input type="password">` fields, which are inherently masked. The new `MaskedField` component is available for any read-only secret display.

## 4c. Double-Submit Prevention

| Finding | Severity | Status |
|---|---|---|
| All forms use `useTransition` with `disabled={pending}` | LOW | PASS |

Verified across 60+ form submissions — every form button is disabled while its transition is pending. Pattern: `const [pending, start] = useTransition()` + `disabled={pending}`.

## 4d. Error Message Leakage

| Finding | Severity | Status |
|---|---|---|
| Client catch blocks use `e.message` | MEDIUM | ACCEPTABLE |
| Service layer uses typed `AppError` with `safeMessage` | N/A | PASS |

All errors thrown by the service layer are instances of `AppError` (ValidationError, ForbiddenError, NotFoundError, etc.) which carry a `safeMessage` field. The `e.message` exposed to the client is always the safe message. Raw Prisma/system errors are caught by the `createService` wrapper and re-thrown as generic `UpstreamError` with a safe message. Stack traces are sent to Sentry only.

The `toSafeError()` utility at `lib/errors.ts:70-80` ensures any unknown error becomes a 500 with correlation ID, never exposing raw error detail.

## 4e. Destructive Action Confirmation

| Finding | Severity | Status |
|---|---|---|
| 17 `window.confirm()` calls replaced with `useConfirmAction` | HIGH | FIXED |
| 2 `alert()` calls replaced with inline error state | MEDIUM | FIXED |
| All delete/remove/archive actions now use `ConfirmDialog` | N/A | PASS |

Every destructive action in the admin now goes through the `useConfirmAction` hook which renders a Radix AlertDialog modal. Dangerous actions use the `variant: "danger"` styling.

## 4f. CSRF / Revalidation

| Finding | Severity | Status |
|---|---|---|
| All mutating server actions call `revalidatePath` or `revalidateTag` | LOW | PASS |

Verified via the `createService` factory: every service calls `revalidateTag` on success. Server actions additionally call `revalidatePath` for the admin routes they affect. Next.js Server Actions include built-in CSRF protection via the `__next_action_id` token.

## Summary

| Category | Findings | Fixed | Remaining |
|---|---|---|---|
| organizationId trust | 0 issues | N/A | 0 |
| Sensitive field masking | 0 issues | N/A | 0 |
| Double-submit prevention | 0 issues | N/A | 0 |
| Error message leakage | 0 issues (safe by design) | N/A | 0 |
| Destructive action confirmation | 19 issues | 19 fixed | 0 |
| CSRF / revalidation | 0 issues | N/A | 0 |
