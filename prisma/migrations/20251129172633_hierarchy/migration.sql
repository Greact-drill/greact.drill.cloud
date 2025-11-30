/*
  Warnings:

  - You are about to drop the `block_customization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `block` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."block" DROP CONSTRAINT "block_edge_id_fkey";

-- AlterTable
ALTER TABLE "public"."edge" ADD COLUMN     "parent_id" VARCHAR(100);

-- Создаем временные таблицы для backup данных (опционально, для безопасности)
CREATE TABLE IF NOT EXISTS "public"."block_backup" AS TABLE "public"."block";
CREATE TABLE IF NOT EXISTS "frontend"."block_customization_backup" AS TABLE "frontend"."block_customization";

-- Переносим данные из block в edge как дочерние элементы
INSERT INTO "public"."edge" (id, name, parent_id)
SELECT 
    b.id, 
    b.name, 
    b.edge_id as parent_id
FROM "public"."block" b
WHERE NOT EXISTS (SELECT 1 FROM "public"."edge" e WHERE e.id = b.id); -- избегаем конфликтов по ID

-- Переносим данные из block_customization в edge_customization
INSERT INTO "frontend"."edge_customization" (edge_id, key, value)
SELECT 
    bc.block_id as edge_id,
    bc.key,
    bc.value
FROM "frontend"."block_customization" bc
WHERE NOT EXISTS (
    SELECT 1 
    FROM "frontend"."edge_customization" ec 
    WHERE ec.edge_id = bc.block_id AND ec.key = bc.key
); -- избегаем дубликатов по уникальному ключу

-- DropTable
DROP TABLE "frontend"."block_customization";

-- DropTable
DROP TABLE "public"."block";

-- CreateIndex
CREATE INDEX "edge_parent_id_idx" ON "public"."edge"("parent_id");

-- AddForeignKey
ALTER TABLE "public"."edge" ADD CONSTRAINT "edge_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."edge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frontend"."edge_customization" ADD CONSTRAINT "edge_customization_edge_id_fkey" FOREIGN KEY ("edge_id") REFERENCES "public"."edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frontend"."tag_customization" ADD CONSTRAINT "tag_customization_edge_id_fkey" FOREIGN KEY ("edge_id") REFERENCES "public"."edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frontend"."tag_customization" ADD CONSTRAINT "tag_customization_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Опционально: удаляем backup таблицы после успешной миграции (раскомментировать после проверки)
DROP TABLE "public"."block_backup";
DROP TABLE "frontend"."block_customization_backup";