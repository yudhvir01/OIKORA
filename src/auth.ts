import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return null;
        }

        // Users can belong to more than one org (Week 19 org switcher), but
        // until that ships, the session pins to the earliest membership.
        const membership = await prisma.membership.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });
        if (!membership) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          activeOrganizationId: membership.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.role = user.role;
        token.id = user.id as string;
        token.activeOrganizationId = user.activeOrganizationId;
      }

      // Org switcher (Week 19): the client calls `unstable_update({ user:
      // { activeOrganizationId } })`, which re-invokes this callback with
      // trigger "update". Re-verify membership here rather than trusting
      // the caller -- this is the one place a forged/stale org id would
      // otherwise get baked into a signed session token.
      if (trigger === "update" && session?.user?.activeOrganizationId) {
        const membership = await prisma.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: token.id,
              organizationId: session.user.activeOrganizationId,
            },
          },
        });
        if (membership) {
          token.activeOrganizationId = membership.organizationId;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "STAFF";
        session.user.activeOrganizationId = token.activeOrganizationId;
      }
      return session;
    },
  },
});
