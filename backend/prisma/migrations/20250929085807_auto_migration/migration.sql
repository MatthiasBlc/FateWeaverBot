/*
  Warnings:

  - You are about to drop the column `city_id` on the `chantiers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,town_id]` on the table `chantiers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `town_id` to the `chantiers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "chantiers" DROP CONSTRAINT "chantiers_city_id_fkey";

-- DropIndex
DROP INDEX "chantiers_name_city_id_key";

-- AlterTable
ALTER TABLE "chantiers" DROP COLUMN "city_id",
ADD COLUMN     "town_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "chantiers_name_town_id_key" ON "chantiers"("name", "town_id");

-- AddForeignKey
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
