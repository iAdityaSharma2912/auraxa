import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const apiUrl =
            process.env.API_INTERNAL_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            "http://localhost:8000";

          const res = await fetch(`${apiUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email:    credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          return {
            id:           "email-user",
            email:        credentials.email as string,
            backendToken: data.access_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Google OAuth flow
      if (account?.provider === "google" && account.id_token) {
        try {
          const apiUrl =
            process.env.API_INTERNAL_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            "http://localhost:8000";

          const res = await fetch(`${apiUrl}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });

          if (res.ok) {
            const data = await res.json();
            token.backendAccessToken  = data.access_token;
            token.backendRefreshToken = data.refresh_token;
          }
        } catch (e) {
          console.error("[auth] Backend Google exchange failed:", e);
        }
      }

      // Credentials flow — backend token comes from user object
      if (account?.provider === "credentials" && (user as any)?.backendToken) {
        token.backendAccessToken = (user as any).backendToken;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      (session as any).backendToken = token.backendAccessToken ?? null;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
});
