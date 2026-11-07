import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// A random, unique username such as "user_k3j9x2ab" for people who sign up
// with Google. It isn't derived from their email or name, so it can't give
// away who they are.
async function generateUsername() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `user_${randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const taken = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  throw new Error("Could not generate a unique username");
}

// Server-side auth instance. Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL
// from the environment. Users, sessions and passwords live in our own
// Postgres tables (see prisma/schema.prisma), not in a hosted auth service.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  // Google sign-in is only switched on when its credentials are in .env, so
  // the app still runs for anyone who hasn't set them up.
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            // Let people choose which Google account to use every time.
            prompt: "select_account",
            // This is an anonymous app: don't keep the person's real name or
            // Google photo. Their name becomes a random username instead.
            // (Only applied when the account is first created.)
            mapProfileToUser: async () => {
              const username = await generateUsername();
              return { name: username, username, displayUsername: username, image: undefined };
            },
          },
        }
      : undefined,
  databaseHooks: {
    user: {
      create: {
        // Email sign-ups only give a nickname (name), which may be Thai and so
        // can't be a username. users.username is required, so give them a
        // random one; they log in with their email anyway.
        before: async (user) => {
          if (typeof user.username === "string" && user.username) return;
          const username = await generateUsername();
          return { data: { ...user, username, displayUsername: username } };
        },
      },
    },
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
