/*
  Warnings:

  - You are about to drop the `cities` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chantiers" DROP CONSTRAINT "chantiers_city_id_fkey";

-- DropForeignKey
ALTER TABLE "cities" DROP CONSTRAINT "cities_guild_id_fkey";

-- DropTable
DROP TABLE "cities";

-- CreateTable
CREATE TABLE "towns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "food_stock" INTEGER NOT NULL DEFAULT 100,
    "guild_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "towns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "towns_guild_id_key" ON "towns"("guild_id");

-- AddForeignKey
ALTER TABLE "towns" ADD CONSTRAINT "towns_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
