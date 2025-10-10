/*
  Warnings:

  - Changed the type of `locationType` on the `resource_stocks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('CITY', 'EXPEDITION');

-- AlterTable
ALTER TABLE "resource_stocks" ADD COLUMN     "expedition_id" TEXT,
ADD COLUMN     "town_id" TEXT,
DROP COLUMN "locationType",
ADD COLUMN     "locationType" "LocationType" NOT NULL;

-- CreateIndex
CREATE INDEX "resource_stocks_locationType_locationId_idx" ON "resource_stocks"("locationType", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_stocks_locationType_locationId_resourceTypeId_key" ON "resource_stocks"("locationType", "locationId", "resourceTypeId");

-- AddForeignKey
ALTER TABLE "resource_stocks" ADD CONSTRAINT "resource_stocks_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_stocks" ADD CONSTRAINT "resource_stocks_expedition_id_fkey" FOREIGN KEY ("expedition_id") REFERENCES "expeditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
