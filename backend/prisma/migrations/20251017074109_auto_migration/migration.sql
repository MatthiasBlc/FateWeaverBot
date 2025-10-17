-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "job_id" INTEGER;

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "starting_ability_id" TEXT NOT NULL,
    "optional_ability_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_name_key" ON "jobs"("name");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_starting_ability_id_fkey" FOREIGN KEY ("starting_ability_id") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_optional_ability_id_fkey" FOREIGN KEY ("optional_ability_id") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
