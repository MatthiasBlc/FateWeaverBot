/*
  Warnings:

  - Added the required column `discriminator` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "servers" ADD COLUMN     "memberCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "discriminator" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;
