-- CreateEnum
CREATE TYPE "CapabilityCategory" AS ENUM ('HARVEST', 'SPECIAL');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('SUMMER', 'WINTER');

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "divert_counter" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "capabilities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CapabilityCategory" NOT NULL,
    "cost_pa" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_capabilities" (
    "character_id" TEXT NOT NULL,
    "capability_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_capabilities_pkey" PRIMARY KEY ("character_id","capability_id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" "SeasonType" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "capabilities_name_key" ON "capabilities"("name");

-- AddForeignKey
ALTER TABLE "character_capabilities" ADD CONSTRAINT "character_capabilities_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_capabilities" ADD CONSTRAINT "character_capabilities_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
