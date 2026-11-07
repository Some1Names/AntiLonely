import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { prisma } from "./prisma";

// Server-side auth instance. Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL
// from the environment. Users, sessions and passwords live in our own
// Postgres tables (see prisma/schema.prisma), not in a hosted auth service.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // Matches the UserRole enum. input: false so users can't pick their own role at signup.
      role: { type: "string", defaultValue: "user", input: false },
    },
  },
  advanced: {
    database: {
      // Our id columns are Postgres UUIDs.
      generateId: "uuid",
    },
  },
  plugins: [
    // Lets users sign in with a username instead of an email.
    username(),
    // Must be last: lets server actions set auth cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
