import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    backendToken?: string | null;
  }

  interface JWT {
    backendAccessToken?: string;
    backendRefreshToken?: string;
  }
}