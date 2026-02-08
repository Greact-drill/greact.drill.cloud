-- CreateTable
CREATE TABLE "public"."edge_tag" (
    "edge_id" VARCHAR(100) NOT NULL,
    "tag_id" VARCHAR(100) NOT NULL,

    CONSTRAINT "edge_tag_pkey" PRIMARY KEY ("edge_id", "tag_id")
);

-- CreateIndex
CREATE INDEX "edge_tag_tag_id_idx" ON "public"."edge_tag"("tag_id");

-- AddForeignKey
ALTER TABLE "public"."edge_tag" ADD CONSTRAINT "edge_tag_edge_id_fkey" FOREIGN KEY ("edge_id") REFERENCES "public"."edge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."edge_tag" ADD CONSTRAINT "edge_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill links from existing tag customizations
INSERT INTO "public"."edge_tag" ("edge_id", "tag_id")
SELECT DISTINCT "edge_id", "tag_id"
FROM "frontend"."tag_customization"
ON CONFLICT DO NOTHING;
