import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma CLI config (migrate, studio, generate).
// The CLI uses the DIRECT connection (Supabase port 5432) because migrations
// don't work through the transaction pooler. The app itself connects through
// the pooled DATABASE_URL — see lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // process.env (not env()) so `prisma generate` still works without a .env.
    url: process.env.DIRECT_URL,
  },
});
