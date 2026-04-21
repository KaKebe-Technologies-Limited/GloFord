/**
 * Typed error hierarchy for Gloford.
 *
 * Contract:
 *   • API routes / Server Actions map `AppError` → { code, status, message }.
 *   • Unknown errors become 500 with a correlation id; raw messages never leak.
 *   • `safeMessage` is the only user-visible field. `cause` is for logs.
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly safeMessage: string,
    public override readonly cause?: unknown,
  ) {
    super(safeMessage);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", cause?: unknown) {
    super("VALIDATION", 400, message, cause);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", 403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super("NOT_FOUND", 404, `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict with current state") {
    super("CONFLICT", 409, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super("RATE_LIMIT", 429, message);
  }
}

/** Retryable failure from an external service. */
export class UpstreamError extends AppError {
  constructor(message = "Upstream service failed", cause?: unknown) {
    super("UPSTREAM", 502, message, cause);
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

/** Convert any error into a shape safe to return from an API boundary. */
export function toSafeError(e: unknown, correlationId?: string) {
  if (isAppError(e)) {
    return { code: e.code, status: e.status, message: e.safeMessage, correlationId };
  }
  return {
    code: "INTERNAL",
    status: 500,
    message: "Something went wrong. Please try again.",
    correlationId,
  };
}
