/*
  Warnings:

  - You are about to drop the column `last_pa_update` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `paTotal` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "characters_server_id_idx";

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "last_pa_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paTotal" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "last_pa_update",
DROP COLUMN "paTotal";
