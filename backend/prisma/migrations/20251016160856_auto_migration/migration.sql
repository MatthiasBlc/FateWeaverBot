/*
  Warnings:

  - You are about to drop the column `capability_id` on the `object_skill_bonuses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[object_type_id,skill_id]` on the table `object_skill_bonuses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `skill_id` to the `object_skill_bonuses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "object_skill_bonuses" DROP CONSTRAINT "object_skill_bonuses_capability_id_fkey";

-- DropIndex
DROP INDEX "object_skill_bonuses_object_type_id_capability_id_key";

-- AlterTable
ALTER TABLE "object_skill_bonuses" DROP COLUMN "capability_id",
ADD COLUMN     "skill_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_skills" (
    "character_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_skills_pkey" PRIMARY KEY ("character_id","skill_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "object_skill_bonuses_object_type_id_skill_id_key" ON "object_skill_bonuses"("object_type_id", "skill_id");

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_skill_bonuses" ADD CONSTRAINT "object_skill_bonuses_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
