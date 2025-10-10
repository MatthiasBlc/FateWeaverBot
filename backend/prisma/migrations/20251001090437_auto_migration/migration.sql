/*
  Warnings:

  - You are about to drop the `characters` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "character_roles" DROP CONSTRAINT "character_roles_character_id_fkey";

-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_town_id_fkey";

-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_user_id_fkey";

-- DropTable
DROP TABLE "characters";

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "town_id" TEXT NOT NULL,
    "paTotal" INTEGER NOT NULL DEFAULT 2,
    "last_pa_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hunger_level" INTEGER NOT NULL DEFAULT 4,
    "is_dead" BOOLEAN NOT NULL DEFAULT false,
    "can_reroll" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Character_user_id_idx" ON "Character"("user_id");

-- CreateIndex
CREATE INDEX "Character_town_id_idx" ON "Character"("town_id");

-- CreateIndex
CREATE INDEX "Character_user_id_town_id_idx" ON "Character"("user_id", "town_id");

-- CreateIndex
CREATE INDEX "Character_user_id_town_id_is_active_idx" ON "Character"("user_id", "town_id", "is_active");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_roles" ADD CONSTRAINT "character_roles_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
