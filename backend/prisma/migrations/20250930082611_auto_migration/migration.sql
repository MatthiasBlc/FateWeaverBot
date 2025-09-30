/*
  Warnings:

  - You are about to drop the column `town_id` on the `guilds` table. All the data in the column will be lost.
  - Made the column `name` on table `characters` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_town_id_fkey";

-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_user_id_fkey";

-- DropForeignKey
ALTER TABLE "guilds" DROP CONSTRAINT "guilds_town_id_fkey";

-- DropIndex
DROP INDEX "characters_is_dead_can_reroll_idx";

-- DropIndex
DROP INDEX "characters_town_id_is_active_idx";

-- DropIndex
DROP INDEX "guilds_town_id_key";

-- AlterTable
ALTER TABLE "characters" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "hunger_level" SET DEFAULT 4,
ALTER COLUMN "is_active" SET DEFAULT false;

-- AlterTable
ALTER TABLE "guilds" DROP COLUMN "town_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "characters_user_id_idx" ON "characters"("user_id");

-- CreateIndex
CREATE INDEX "characters_town_id_idx" ON "characters"("town_id");

-- AddForeignKey
ALTER TABLE "towns" ADD CONSTRAINT "towns_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
