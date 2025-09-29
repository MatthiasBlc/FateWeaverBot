/*
  Warnings:

  - You are about to drop the column `server_id` on the `chantiers` table. All the data in the column will be lost.
  - You are about to drop the column `server_id` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `server_id` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the `servers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,guild_id]` on the table `chantiers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,guild_id]` on the table `characters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[discordId,guild_id]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guild_id` to the `chantiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guild_id` to the `characters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guild_id` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "chantiers" DROP CONSTRAINT "chantiers_server_id_fkey";

-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_server_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_server_id_fkey";

-- DropIndex
DROP INDEX "chantiers_name_server_id_key";

-- DropIndex
DROP INDEX "characters_user_id_server_id_key";

-- DropIndex
DROP INDEX "roles_discordId_server_id_key";

-- AlterTable
ALTER TABLE "chantiers" DROP COLUMN "server_id",
ADD COLUMN     "guild_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "characters" DROP COLUMN "server_id",
ADD COLUMN     "guild_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "server_id",
ADD COLUMN     "guild_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "servers";

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "discord_guild_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "logChannelId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guilds_discord_guild_id_key" ON "guilds"("discord_guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "chantiers_name_guild_id_key" ON "chantiers"("name", "guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "characters_user_id_guild_id_key" ON "characters"("user_id", "guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_discordId_guild_id_key" ON "roles"("discordId", "guild_id");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
