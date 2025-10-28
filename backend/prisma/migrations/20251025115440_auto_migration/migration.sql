-- CreateTable
CREATE TABLE "emoji_configs" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emoji_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emoji_configs_type_key_key" ON "emoji_configs"("type", "key");
