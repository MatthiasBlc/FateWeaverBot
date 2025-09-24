/*
  Warnings:

  - Made the column `name` on table `servers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "servers" ALTER COLUMN "name" SET NOT NULL;
