import type { NextAuthConfig } from "next-auth";

/** Edge-safe config (no Prisma/bcrypt) — used by middleware. */
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.vendorId = user.vendorId;
        token.vendorStatus = user.vendorStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.vendorId = token.vendorId as string | undefined;
        session.user.vendorStatus = token.vendorStatus as string | undefined;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
};
