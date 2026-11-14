import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { randomBytes } from "node:crypto";
import {
  googleOnlyAccountEmail,
  RESET_LINK_LIFETIME_SECONDS,
  resetPasswordEmail,
  sendEmail,
} from "./email";
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
    // ลืมรหัสผ่าน: Better Auth makes a one-time token and calls this with a
    // link to /api/auth/reset-password/<token>, which checks the token and
    // sends the person on to our /reset-password page. The request endpoint
    // answers the same whether or not the email has an account, so failures
    // here are logged, never thrown (a 500 would give that away).
    sendResetPassword: async ({ user, url }) => {
      try {
        const hasPassword = await prisma.account.findFirst({
          where: { userId: user.id, providerId: "credential" },
          select: { id: true },
        });
        // Accounts made with Google have no password. Resetting would quietly
        // add one, so tell them to use Google instead and send no link.
        const message = hasPassword
          ? resetPasswordEmail(user.email, url)
          : googleOnlyAccountEmail(user.email, new URL("/login", url).href);
        await sendEmail(message);
      } catch (error) {
        console.error("[auth] Could not send the password reset email", error);
      }
    },
    resetPasswordTokenExpiresIn: RESET_LINK_LIFETIME_SECONDS,
    // A reset is often because someone else got in: sign out everywhere.
    revokeSessionsOnPasswordReset: true,
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
    session: {
      create: {
        // Suspended or banned users can't log in (a new session is refused).
        // Their existing sessions are deleted when the sanction is issued.
        before: async (session) => {
          const now = new Date();
          const sanction = await prisma.sanction.findFirst({
            where: {
              userId: session.userId,
              type: { in: ["suspension", "ban"] },
              liftedAt: null,
              // No startAt check: sanctions start when issued, and the DB clock
              // can be slightly ahead of the app server's.
              OR: [{ endAt: null }, { endAt: { gt: now } }],
            },
            // Ban (last in the enum) wins over suspension; then the latest end.
            orderBy: [{ type: "desc" }, { endAt: { sort: "desc", nulls: "first" } }],
            select: { type: true, endAt: true },
          });
          if (!sanction) return;
          throw new APIError("FORBIDDEN", {
            code: sanction.type === "ban" ? "ACCOUNT_BANNED" : "ACCOUNT_SUSPENDED",
            message:
              sanction.type === "ban"
                ? "This account has been banned."
                : `This account is suspended until ${sanction.endAt?.toISOString()}.`,
            // Shown on the login form as "ถึงวันที่ …".
            suspendedUntil: sanction.endAt?.toISOString() ?? null,
          });
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
