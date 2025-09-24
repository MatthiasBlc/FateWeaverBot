-- CreateEnum
CREATE TYPE "ChantierStatus" AS ENUM ('PLAN', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "chantiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "cost" INTEGER NOT NULL,
    "spendOnIt" INTEGER NOT NULL DEFAULT 0,
    "status" "ChantierStatus" NOT NULL DEFAULT 'PLAN',
    "server_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chantiers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "chantiers" ADD CONSTRAINT "chantiers_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
