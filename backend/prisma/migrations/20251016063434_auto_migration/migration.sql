-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('NORD', 'NORD_EST', 'EST', 'SUD_EST', 'SUD', 'SUD_OUEST', 'OUEST', 'NORD_OUEST', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DailyEventType" AS ENUM ('PROJECT_COMPLETED', 'CHANTIER_COMPLETED', 'RESOURCE_GATHERED', 'EXPEDITION_DEPARTED', 'EXPEDITION_RETURNED', 'EXPEDITION_EMERGENCY_RETURN', 'CHARACTER_CATASTROPHIC_RETURN');

-- AlterTable
ALTER TABLE "expeditions" ADD COLUMN     "current_day_direction" "Direction",
ADD COLUMN     "direction_set_at" TIMESTAMP(3),
ADD COLUMN     "direction_set_by" TEXT,
ADD COLUMN     "initial_direction" "Direction",
ADD COLUMN     "path" "Direction"[] DEFAULT ARRAY[]::"Direction"[];

-- CreateTable
CREATE TABLE "daily_event_logs" (
    "id" TEXT NOT NULL,
    "event_type" "DailyEventType" NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "town_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_event_logs_event_date_town_id_idx" ON "daily_event_logs"("event_date", "town_id");

-- AddForeignKey
ALTER TABLE "daily_event_logs" ADD CONSTRAINT "daily_event_logs_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
