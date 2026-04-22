import { z } from "zod";
import { cuid, email } from "./common";

export const userInviteSchema = z.object({
  email,
  name: z.string().trim().max(120).optional(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export const userUpdateRoleSchema = z.object({
  userId: cuid,
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export const userDeactivateSchema = z.object({ userId: cuid });
