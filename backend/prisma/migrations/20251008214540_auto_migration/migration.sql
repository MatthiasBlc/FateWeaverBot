-- AlterTable
ALTER TABLE "expeditions" ADD COLUMN     "pending_emergency_return" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "expedition_emergency_votes" (
    "id" TEXT NOT NULL,
    "expedition_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expedition_emergency_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expedition_emergency_votes_expedition_id_user_id_key" ON "expedition_emergency_votes"("expedition_id", "user_id");

-- AddForeignKey
ALTER TABLE "expedition_emergency_votes" ADD CONSTRAINT "expedition_emergency_votes_expedition_id_fkey" FOREIGN KEY ("expedition_id") REFERENCES "expeditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
