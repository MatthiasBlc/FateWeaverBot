/*
  Warnings:

  - The values [TRAVAILLER_LE_BOIS] on the enum `CraftType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "CapacityBonusType" AS ENUM ('LUCKY_ROLL', 'HEAL_EXTRA', 'ENTERTAIN_BURST', 'ADMIN_INTERPRETED');

-- AlterEnum
BEGIN;
CREATE TYPE "CraftType_new" AS ENUM ('TISSER', 'FORGER', 'MENUISER');
ALTER TABLE "project_craft_types" ALTER COLUMN "craft_type" TYPE "CraftType_new" USING ("craft_type"::text::"CraftType_new");
ALTER TYPE "CraftType" RENAME TO "CraftType_old";
ALTER TYPE "CraftType_new" RENAME TO "CraftType";
DROP TYPE "CraftType_old";
COMMIT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "output_object_type_id" INTEGER,
ALTER COLUMN "output_resource_type_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "towns" ADD COLUMN     "grigri_found" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "object_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "object_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_inventories" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_inventory_slots" (
    "id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "object_type_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_inventory_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "object_skill_bonuses" (
    "id" TEXT NOT NULL,
    "object_type_id" INTEGER NOT NULL,
    "capability_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "object_skill_bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "object_capacity_bonuses" (
    "id" TEXT NOT NULL,
    "object_type_id" INTEGER NOT NULL,
    "capability_id" TEXT NOT NULL,
    "bonus_type" "CapacityBonusType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "object_capacity_bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "object_resource_conversions" (
    "id" TEXT NOT NULL,
    "object_type_id" INTEGER NOT NULL,
    "resource_type_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "object_resource_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fishing_loot_entries" (
    "id" TEXT NOT NULL,
    "pa_table" INTEGER NOT NULL,
    "resource_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fishing_loot_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "object_types_name_key" ON "object_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "character_inventories_character_id_key" ON "character_inventories"("character_id");

-- CreateIndex
CREATE INDEX "character_inventory_slots_inventory_id_idx" ON "character_inventory_slots"("inventory_id");

-- CreateIndex
CREATE UNIQUE INDEX "object_skill_bonuses_object_type_id_capability_id_key" ON "object_skill_bonuses"("object_type_id", "capability_id");

-- CreateIndex
CREATE UNIQUE INDEX "object_capacity_bonuses_object_type_id_capability_id_key" ON "object_capacity_bonuses"("object_type_id", "capability_id");

-- CreateIndex
CREATE UNIQUE INDEX "object_resource_conversions_object_type_id_resource_type_id_key" ON "object_resource_conversions"("object_type_id", "resource_type_id");

-- CreateIndex
CREATE INDEX "fishing_loot_entries_pa_table_is_active_idx" ON "fishing_loot_entries"("pa_table", "is_active");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_output_object_type_id_fkey" FOREIGN KEY ("output_object_type_id") REFERENCES "object_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_inventories" ADD CONSTRAINT "character_inventories_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_inventory_slots" ADD CONSTRAINT "character_inventory_slots_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "character_inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_inventory_slots" ADD CONSTRAINT "character_inventory_slots_object_type_id_fkey" FOREIGN KEY ("object_type_id") REFERENCES "object_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_skill_bonuses" ADD CONSTRAINT "object_skill_bonuses_object_type_id_fkey" FOREIGN KEY ("object_type_id") REFERENCES "object_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_skill_bonuses" ADD CONSTRAINT "object_skill_bonuses_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_capacity_bonuses" ADD CONSTRAINT "object_capacity_bonuses_object_type_id_fkey" FOREIGN KEY ("object_type_id") REFERENCES "object_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_capacity_bonuses" ADD CONSTRAINT "object_capacity_bonuses_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_resource_conversions" ADD CONSTRAINT "object_resource_conversions_object_type_id_fkey" FOREIGN KEY ("object_type_id") REFERENCES "object_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_resource_conversions" ADD CONSTRAINT "object_resource_conversions_resource_type_id_fkey" FOREIGN KEY ("resource_type_id") REFERENCES "resource_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
