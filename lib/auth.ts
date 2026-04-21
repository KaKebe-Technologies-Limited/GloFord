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

// `next-auth/jwt` isn't re-exported at the package root in v5 beta —
// we augment the `jwt` callback's token via ambient shape inside the
// callback instead.

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
      // On initial sign-in, `user` is populated. Load the first active
      // membership and stash domain fields on the token. We cast
      // because next-auth v5's JWT type is a plain Record<string, unknown>.
      if (user?.id) {
        const membership = await loadPrimaryMembership(user.id);
        if (!membership) return token;
        const t = token as Record<string, unknown>;
        t.id = user.id;
        t.orgId = membership.organizationId;
        t.role = membership.role.name;
        t.roleId = membership.roleId;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as {
        id?: string;
        orgId?: string;
        role?: RoleName;
        roleId?: string;
      };
      if (t.id && t.orgId && t.role && t.roleId) {
        session.user.id = t.id;
        session.user.orgId = t.orgId;
        session.user.role = t.role;
        session.user.roleId = t.roleId;
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
