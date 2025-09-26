/*
  Warnings:

  - You are about to drop the column `logChannelId` on the `servers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "servers" DROP COLUMN "logChannelId",
ADD COLUMN     "log_channel_id" TEXT;
