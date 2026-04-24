import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import type { RoleName } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: RoleName;
      roleId: string;
    };
  }
}

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: { email: { label: "Email" }, password: { label: "Password", type: "password" } },
      authorize: async (raw) => {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            isActive: true,
          },
        });
        if (!user || !user.isActive || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const profile = await loadUserRole(user.id);
        if (!profile) return token;
        const t = token as Record<string, unknown>;
        t.id = user.id;
        t.role = profile.role.name;
        t.roleId = profile.roleId;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as {
        id?: string;
        role?: RoleName;
        roleId?: string;
      };
      if (t.id && t.role && t.roleId) {
        session.user.id = t.id;
        session.user.role = t.role;
        session.user.roleId = t.roleId;
      }
      return session;
    },
  },
});

async function loadUserRole(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId, isActive: true },
    select: { roleId: true, role: { select: { name: true } } },
  });
  if (!user || !user.roleId || !user.role) return null;
  return { roleId: user.roleId, role: user.role };
}
