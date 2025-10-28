-- AlterTable
ALTER TABLE "expeditions" ADD COLUMN     "channel_configured_at" TIMESTAMP(3),
ADD COLUMN     "channel_configured_by" TEXT,
ADD COLUMN     "expedition_channel_id" TEXT;
