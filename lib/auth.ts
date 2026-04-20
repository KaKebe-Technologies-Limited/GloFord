import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import type { RoleName } from "@prisma/client";

// Augment session with our domain fields
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      orgId: string;
      role: RoleName;
      roleId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: string;
    role: RoleName;
    roleId: string;
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
        const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, image: true, passwordHash: true, isActive: true } });
        if (!user || !user.isActive || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, `user` is populated. Load the first active membership.
      if (user?.id) {
        const membership = await loadPrimaryMembership(user.id);
        if (!membership) return token;
        token.id = user.id;
        token.orgId = membership.organizationId;
        token.role = membership.role.name;
        token.roleId = membership.roleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
        session.user.orgId = token.orgId;
        session.user.role = token.role;
        session.user.roleId = token.roleId;
      }
      return session;
    },
  },
});

async function loadPrimaryMembership(userId: string) {
  return db.orgMembership.findFirst({
    where: { userId, organization: { isActive: true } },
    select: { organizationId: true, roleId: true, role: { select: { name: true } } },
    orderBy: { joinedAt: "asc" },
  });
}
