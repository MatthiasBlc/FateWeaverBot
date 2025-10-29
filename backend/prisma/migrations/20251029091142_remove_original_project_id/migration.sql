-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_originalProjectId_fkey";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN IF EXISTS "originalProjectId";
