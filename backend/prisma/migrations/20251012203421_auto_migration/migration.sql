/*
  Warnings:

  - Added the required column `emojiTag` to the `capabilities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "capabilities" ADD COLUMN     "emojiTag" TEXT NOT NULL;
