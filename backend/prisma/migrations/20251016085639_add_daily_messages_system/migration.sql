-- Add daily messages system models
-- Migration: 20251016085639_add_daily_messages_system

-- Create enum for weather message types
CREATE TYPE "WeatherMessageType" AS ENUM ('NORMAL_SUMMER', 'NORMAL_WINTER', 'FIRST_DAY_SUMMER', 'FIRST_DAY_WINTER');

-- Create weather_messages table
CREATE TABLE "weather_messages" (
    "id" TEXT NOT NULL,
    "type" "WeatherMessageType" NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weather_messages_pkey" PRIMARY KEY ("id")
);

-- Create weather_message_usage table
CREATE TABLE "weather_message_usage" (
    "id" TEXT NOT NULL,
    "weather_message_id" TEXT NOT NULL,
    "season_start_date" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_message_usage_pkey" PRIMARY KEY ("id")
);

-- Create daily_message_overrides table
CREATE TABLE "daily_message_overrides" (
    "id" TEXT NOT NULL,
    "town_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_message_overrides_pkey" PRIMARY KEY ("id")
);

-- Create indexes for weather_message_usage
CREATE INDEX "weather_message_usage_season_start_date_weather_message_id_idx" ON "weather_message_usage"("season_start_date", "weather_message_id");

-- Create unique index for daily_message_overrides
CREATE UNIQUE INDEX "daily_message_overrides_town_id_date_key" ON "daily_message_overrides"("town_id", "date");

-- Add foreign key constraint for weather_message_usage
ALTER TABLE "weather_message_usage" ADD CONSTRAINT "weather_message_usage_weather_message_id_fkey" FOREIGN KEY ("weather_message_id") REFERENCES "weather_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key constraint for daily_message_overrides
ALTER TABLE "daily_message_overrides" ADD CONSTRAINT "daily_message_overrides_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
