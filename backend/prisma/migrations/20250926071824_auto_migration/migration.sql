/*
  Warnings:

  - You are about to drop the column `notification_channel_id` on the `servers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "servers" DROP COLUMN "notification_channel_id",
ADD COLUMN     "logChannelId" TEXT;
