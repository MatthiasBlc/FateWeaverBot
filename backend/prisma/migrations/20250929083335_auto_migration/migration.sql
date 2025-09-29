/*
  Warnings:

  - You are about to drop the column `guild_id` on the `chantiers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,city_id]` on the table `chantiers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `city_id` to the `chantiers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "chantiers" DROP CONSTRAINT "chantiers_guild_id_fkey";

-- DropIndex
DROP INDEX "chantiers_name_guild_id_key";

-- AlterTable
ALTER TABLE "chantiers" DROP COLUMN "guild_id",
ADD COLUMN     "city_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "food_stock" INTEGER NOT NULL DEFAULT 100,
    "guild_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_guild_id_key" ON "cities"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "chantiers_name_city_id_key" ON "chantiers"("name", "city_id");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
