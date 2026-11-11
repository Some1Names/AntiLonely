import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// Browser-side auth client: signIn, signUp, signOut, useSession.
// Same origin as the app, so no baseURL is needed.
// inferAdditionalFields exposes custom user fields (like role) on the session type.
export const authClient = createAuthClient({
  plugins: [usernameClient(), inferAdditionalFields<typeof auth>()],
});
