import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import type { Actor } from "@/lib/tenant/context";

/**
 * Resolve the current Actor from the Auth.js session. Services never
 * call this themselves — it sits at the boundary between Server Actions
 * / API routes and the service layer.
 */
export async function requireActorFromSession(): Promise<Actor> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return {
    userId: session.user.id,
    roleId: session.user.roleId,
    role: session.user.role,
    email: session.user.email ?? "",
  };
}

export async function getActorFromSession(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    roleId: session.user.roleId,
    role: session.user.role,
    email: session.user.email ?? "",
  };
}
