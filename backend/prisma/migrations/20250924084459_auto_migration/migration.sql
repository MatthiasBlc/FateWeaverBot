/*
  Warnings:

  - The primary key for the `character_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[character_id,role_id]` on the table `character_roles` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `character_roles` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `role_name` to the `character_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `character_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `character_roles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "character_roles" DROP CONSTRAINT "character_roles_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "role_name" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ADD CONSTRAINT "character_roles_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "character_roles_character_id_role_id_key" ON "character_roles"("character_id", "role_id");
