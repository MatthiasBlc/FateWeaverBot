/*
  Warnings:

  - You are about to drop the column `role_name` on the `character_roles` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `character_roles` table. All the data in the column will be lost.
  - You are about to drop the column `expedition_id` on the `resource_stocks` table. All the data in the column will be lost.
  - You are about to drop the column `town_id` on the `resource_stocks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "resource_stocks" DROP CONSTRAINT "resource_stocks_expedition_id_fkey";

-- DropForeignKey
ALTER TABLE "resource_stocks" DROP CONSTRAINT "resource_stocks_town_id_fkey";

-- DropIndex
DROP INDEX "Character_user_id_town_id_is_active_idx";

-- AlterTable
ALTER TABLE "character_roles" DROP COLUMN "role_name",
DROP COLUMN "username";

-- AlterTable
ALTER TABLE "resource_stocks" DROP COLUMN "expedition_id",
DROP COLUMN "town_id";

-- CreateIndex
CREATE INDEX "Character_user_id_town_id_is_active_is_dead_idx" ON "Character"("user_id", "town_id", "is_active", "is_dead");

-- CreateIndex
CREATE INDEX "Character_is_dead_idx" ON "Character"("is_dead");

-- CreateIndex
CREATE INDEX "Character_pm_idx" ON "Character"("pm");

-- CreateIndex
CREATE INDEX "Character_job_id_idx" ON "Character"("job_id");

-- CreateIndex
CREATE INDEX "chantiers_status_idx" ON "chantiers"("status");

-- CreateIndex
CREATE INDEX "chantiers_town_id_status_idx" ON "chantiers"("town_id", "status");

-- CreateIndex
CREATE INDEX "daily_event_logs_town_id_idx" ON "daily_event_logs"("town_id");

-- CreateIndex
CREATE INDEX "expeditions_status_idx" ON "expeditions"("status");

-- CreateIndex
CREATE INDEX "expeditions_status_pending_emergency_return_idx" ON "expeditions"("status", "pending_emergency_return");

-- CreateIndex
CREATE INDEX "expeditions_town_id_status_idx" ON "expeditions"("town_id", "status");

-- CreateIndex
CREATE INDEX "expeditions_status_return_at_idx" ON "expeditions"("status", "return_at");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_town_id_status_idx" ON "projects"("town_id", "status");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_output_resource_type_id_fkey" FOREIGN KEY ("output_resource_type_id") REFERENCES "resource_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
