/*
  Warnings:

  - A unique constraint covering the columns `[block_id,key]` on the table `block_customization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[edge_id,key]` on the table `edge_customization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[edge_id,tag_id,key]` on the table `tag_customization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "block_customization_block_id_key_key" ON "frontend"."block_customization"("block_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "edge_customization_edge_id_key_key" ON "frontend"."edge_customization"("edge_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "tag_customization_edge_id_tag_id_key_key" ON "frontend"."tag_customization"("edge_id", "tag_id", "key");
