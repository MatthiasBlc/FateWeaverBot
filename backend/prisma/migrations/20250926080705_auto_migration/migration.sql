/*
  Warnings:

  - You are about to drop the column `log_channel_id` on the `servers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "servers" DROP COLUMN "log_channel_id",
ADD COLUMN     "logChannelId" TEXT;
