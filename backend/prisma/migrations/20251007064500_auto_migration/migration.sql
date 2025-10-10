-- CreateTable
CREATE TABLE "resource_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_stocks" (
    "id" SERIAL NOT NULL,
    "locationType" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "resourceTypeId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "resource_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_types_name_key" ON "resource_types"("name");

-- CreateIndex
CREATE INDEX "resource_stocks_locationType_locationId_idx" ON "resource_stocks"("locationType", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_stocks_locationType_locationId_resourceTypeId_key" ON "resource_stocks"("locationType", "locationId", "resourceTypeId");

-- AddForeignKey
ALTER TABLE "resource_stocks" ADD CONSTRAINT "resource_stocks_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "resource_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
