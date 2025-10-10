-- CreateTable
CREATE TABLE "chantier_resource_costs" (
    "id" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "resource_type_id" INTEGER NOT NULL,
    "quantity_required" INTEGER NOT NULL,
    "quantity_contributed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chantier_resource_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chantier_resource_costs_chantier_id_resource_type_id_key" ON "chantier_resource_costs"("chantier_id", "resource_type_id");

-- AddForeignKey
ALTER TABLE "chantier_resource_costs" ADD CONSTRAINT "chantier_resource_costs_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "chantiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chantier_resource_costs" ADD CONSTRAINT "chantier_resource_costs_resource_type_id_fkey" FOREIGN KEY ("resource_type_id") REFERENCES "resource_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
