/*
  Warnings:

  - A unique constraint covering the columns `[name,server_id]` on the table `chantiers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "chantiers_name_server_id_key" ON "chantiers"("name", "server_id");
