/*
  Warnings:

  - You are about to drop the column `guild_id` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `guilds` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,town_id,is_active]` on the table `characters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[town_id]` on the table `guilds` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `town_id` to the `characters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `town_id` to the `guilds` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_guild_id_fkey";

-- DropForeignKey
ALTER TABLE "towns" DROP CONSTRAINT "towns_guild_id_fkey";

-- DropIndex
DROP INDEX "characters_user_id_guild_id_key";

-- DropIndex
DROP INDEX "characters_user_id_idx";

-- AlterTable
ALTER TABLE "characters" DROP COLUMN "guild_id",
ADD COLUMN     "can_reroll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_dead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "town_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "guilds" DROP COLUMN "created_at",
ADD COLUMN     "town_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "characters_user_id_town_id_idx" ON "characters"("user_id", "town_id");

-- CreateIndex
CREATE INDEX "characters_town_id_is_active_idx" ON "characters"("town_id", "is_active");

-- CreateIndex
CREATE INDEX "characters_is_dead_can_reroll_idx" ON "characters"("is_dead", "can_reroll");

-- CreateIndex
CREATE UNIQUE INDEX "characters_user_id_town_id_is_active_key" ON "characters"("user_id", "town_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_town_id_key" ON "guilds"("town_id");

-- AddForeignKey
ALTER TABLE "guilds" ADD CONSTRAINT "guilds_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
