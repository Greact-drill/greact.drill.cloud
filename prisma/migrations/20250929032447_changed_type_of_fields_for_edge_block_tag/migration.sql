/*
  Warnings:

  - The primary key for the `block` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `edge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tag` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."block" DROP CONSTRAINT "block_edge_id_fkey";

-- AlterTable
ALTER TABLE "frontend"."block_customization" ALTER COLUMN "block_id" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "frontend"."edge_customization" ALTER COLUMN "edge_id" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "frontend"."tag_customization" ALTER COLUMN "edge_id" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "tag_id" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "public"."block" DROP CONSTRAINT "block_pkey",
ALTER COLUMN "edge_id" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "id" SET DATA TYPE VARCHAR(100),
ADD CONSTRAINT "block_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."edge" DROP CONSTRAINT "edge_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(100),
ADD CONSTRAINT "edge_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."tag" DROP CONSTRAINT "tag_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(100),
ADD CONSTRAINT "tag_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."block" ADD CONSTRAINT "block_edge_id_fkey" FOREIGN KEY ("edge_id") REFERENCES "public"."edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
