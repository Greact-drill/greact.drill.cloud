-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "frontend";

-- CreateTable
CREATE TABLE "public"."edge" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "edge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."block" (
    "edge_id" INTEGER NOT NULL,
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tag" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "min" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "unit_of_measurement" TEXT NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frontend"."edge_customization" (
    "id" SERIAL NOT NULL,
    "edge_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "edge_customization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frontend"."block_customization" (
    "id" SERIAL NOT NULL,
    "block_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "block_customization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frontend"."tag_customization" (
    "id" SERIAL NOT NULL,
    "edge_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "tag_customization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "edge_name_idx" ON "public"."edge"("name");

-- CreateIndex
CREATE INDEX "block_edge_id_name_idx" ON "public"."block"("edge_id", "name");

-- CreateIndex
CREATE INDEX "block_edge_id_idx" ON "public"."block"("edge_id");

-- CreateIndex
CREATE INDEX "block_name_idx" ON "public"."block"("name");

-- CreateIndex
CREATE INDEX "tag_name_idx" ON "public"."tag"("name");

-- CreateIndex
CREATE INDEX "edge_customization_edge_id_idx" ON "frontend"."edge_customization"("edge_id");

-- CreateIndex
CREATE INDEX "block_customization_block_id_idx" ON "frontend"."block_customization"("block_id");

-- AddForeignKey
ALTER TABLE "public"."block" ADD CONSTRAINT "block_edge_id_fkey" FOREIGN KEY ("edge_id") REFERENCES "public"."edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
