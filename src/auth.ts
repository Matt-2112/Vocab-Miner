import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { randomUUID } from "crypto";
import db from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Only runs on first sign-in (account is present)
      if (account && profile?.email) {
        const email = profile.email;
        const existing = db
          .prepare("SELECT id, tier FROM users WHERE email = ?")
          .get(email) as { id: string; tier: string } | undefined;

        if (existing) {
          token.uid = existing.id;
          token.tier = existing.tier;
        } else {
          const id = randomUUID();
          db.prepare(
            "INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)"
          ).run(
            id,
            email,
            (profile.name as string | null) ?? null,
            (profile.picture as string | null) ?? null
          );
          token.uid = id;
          token.tier = "free";
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.tier = token.tier as string;
      return session;
    },
  },
});
