-- CreateEnum
CREATE TYPE "ExpeditionStatus" AS ENUM ('PLANNING', 'LOCKED', 'DEPARTED', 'RETURNED');

-- CreateTable
CREATE TABLE "expeditions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "town_id" TEXT NOT NULL,
    "status" "ExpeditionStatus" NOT NULL DEFAULT 'PLANNING',
    "food_stock" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "return_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expeditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedition_members" (
    "id" TEXT NOT NULL,
    "expedition_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expedition_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expedition_members_expedition_id_character_id_key" ON "expedition_members"("expedition_id", "character_id");

-- AddForeignKey
ALTER TABLE "expeditions" ADD CONSTRAINT "expeditions_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedition_members" ADD CONSTRAINT "expedition_members_expedition_id_fkey" FOREIGN KEY ("expedition_id") REFERENCES "expeditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedition_members" ADD CONSTRAINT "expedition_members_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
