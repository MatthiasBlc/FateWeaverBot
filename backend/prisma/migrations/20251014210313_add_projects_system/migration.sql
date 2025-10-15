-- CreateEnum
CREATE TYPE "CraftType" AS ENUM ('TISSER', 'FORGER', 'TRAVAILLER_LE_BOIS');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pa_required" INTEGER NOT NULL,
    "pa_contributed" INTEGER NOT NULL DEFAULT 0,
    "output_resource_type_id" INTEGER NOT NULL,
    "output_quantity" INTEGER NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "town_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_craft_types" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "craft_type" "CraftType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_craft_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_resource_costs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "resource_type_id" INTEGER NOT NULL,
    "quantity_required" INTEGER NOT NULL,
    "quantity_contributed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_resource_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_town_id_key" ON "projects"("name", "town_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_craft_types_project_id_craft_type_key" ON "project_craft_types"("project_id", "craft_type");

-- CreateIndex
CREATE UNIQUE INDEX "project_resource_costs_project_id_resource_type_id_key" ON "project_resource_costs"("project_id", "resource_type_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_town_id_fkey" FOREIGN KEY ("town_id") REFERENCES "towns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_craft_types" ADD CONSTRAINT "project_craft_types_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resource_costs" ADD CONSTRAINT "project_resource_costs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resource_costs" ADD CONSTRAINT "project_resource_costs_resource_type_id_fkey" FOREIGN KEY ("resource_type_id") REFERENCES "resource_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
