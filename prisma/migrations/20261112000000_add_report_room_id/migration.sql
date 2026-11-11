-- AlterTable: add nullable first so existing rows can be backfilled
ALTER TABLE "reports" ADD COLUMN "room_id" UUID;

-- Backfill from the reported message's room
UPDATE "reports" r
SET "room_id" = m."room_id"
FROM "messages" m
WHERE r."message_id" = m."id";

ALTER TABLE "reports" ALTER COLUMN "room_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "reports_room_id_idx" ON "reports"("room_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
