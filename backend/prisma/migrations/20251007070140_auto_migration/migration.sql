/*
  Warnings:

  - You are about to drop the column `food_stock` on the `expeditions` table. All the data in the column will be lost.
  - You are about to drop the column `food_stock` on the `towns` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "expeditions" DROP COLUMN "food_stock";

-- AlterTable
ALTER TABLE "towns" DROP COLUMN "food_stock";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "updated_at";
