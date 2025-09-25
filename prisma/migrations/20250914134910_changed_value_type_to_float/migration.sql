/*
  Warnings:

  - You are about to alter the column `value` on the `current` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,3)` to `DoublePrecision`.
  - You are about to alter the column `value` on the `history` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,3)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "public"."current" ALTER COLUMN "value" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."history" ALTER COLUMN "value" SET DATA TYPE DOUBLE PRECISION;
