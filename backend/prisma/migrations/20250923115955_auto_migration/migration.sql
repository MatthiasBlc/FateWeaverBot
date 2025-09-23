/*
  Warnings:

  - You are about to drop the column `actionPoints` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isBot` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastActionPointTime` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxActionPoints` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ConstructionProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserContribution` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConstructionProject" DROP CONSTRAINT "ConstructionProject_createdById_fkey";

-- DropForeignKey
ALTER TABLE "UserContribution" DROP CONSTRAINT "UserContribution_projectId_fkey";

-- DropForeignKey
ALTER TABLE "UserContribution" DROP CONSTRAINT "UserContribution_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "actionPoints",
DROP COLUMN "isAdmin",
DROP COLUMN "isBot",
DROP COLUMN "lastActionPointTime",
DROP COLUMN "maxActionPoints",
ADD COLUMN     "pa" INTEGER NOT NULL DEFAULT 2;

-- DropTable
DROP TABLE "ConstructionProject";

-- DropTable
DROP TABLE "UserContribution";

-- DropEnum
DROP TYPE "ProjectStatus";
