-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "isBlueprint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalProjectId" TEXT,
ADD COLUMN     "paBlueprintRequired" INTEGER;

-- CreateTable
CREATE TABLE "project_blueprint_resource_costs" (
    "id" SERIAL NOT NULL,
    "projectId" TEXT NOT NULL,
    "resourceTypeId" INTEGER NOT NULL,
    "quantityRequired" INTEGER NOT NULL,
    "quantityProvided" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_blueprint_resource_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_blueprint_resource_costs_projectId_resourceTypeId_key" ON "project_blueprint_resource_costs"("projectId", "resourceTypeId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_originalProjectId_fkey" FOREIGN KEY ("originalProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_blueprint_resource_costs" ADD CONSTRAINT "project_blueprint_resource_costs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_blueprint_resource_costs" ADD CONSTRAINT "project_blueprint_resource_costs_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "resource_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
