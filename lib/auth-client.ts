import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

// Browser-side auth client: signIn, signUp, signOut, useSession.
// Same origin as the app, so no baseURL is needed.
export const authClient = createAuthClient({
  plugins: [usernameClient()],
});
