-- AlterTable: add nullable slug first so existing rows in local/Supabase DBs survive migration.
ALTER TABLE "rooms" ADD COLUMN "slug" TEXT;

-- Backfill every existing row with a deterministic, unique lowercase ASCII slug
-- matching the application's unified auto-slug rules.
WITH normalized AS (
  SELECT
    "id",
    "created_at",
    trim(trailing '-' from left(
      trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g')),
      48
    )) AS base_slug
  FROM "rooms"
),
candidates AS (
  SELECT
    "id",
    "created_at",
    CASE
      WHEN length("base_slug") >= 2
        AND "base_slug" NOT IN (
          'new', 'edit', 'admin', 'api', 'login', 'logout', 'signup',
          'register', 'auth', 'rooms', 'posts', 'notifications',
          'profile', 'settings'
        )
        AND "base_slug" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN "base_slug"
      ELSE 'r-' || substr(encode(sha256(convert_to("id"::text, 'UTF8')), 'hex'), 1, 6)
    END AS candidate_slug
  FROM normalized
),
ranked AS (
  SELECT
    "id",
    CASE
      WHEN ROW_NUMBER() OVER (PARTITION BY "candidate_slug" ORDER BY "created_at" ASC, "id" ASC) = 1
      THEN "candidate_slug"
      ELSE left("candidate_slug", 48) || '-' || substr(
        encode(sha256(convert_to("id"::text, 'UTF8')), 'hex'),
        1,
        4
      )
    END AS final_slug
  FROM candidates
)
UPDATE "rooms" AS r
SET "slug" = ranked."final_slug"
FROM ranked
WHERE r."id" = ranked."id";

ALTER TABLE "rooms" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "rooms_slug_key" ON "rooms"("slug");
