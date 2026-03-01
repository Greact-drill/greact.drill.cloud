-- Store Edge<->Tag mapping directly in edge/tag rows
ALTER TABLE "public"."edge"
ADD COLUMN IF NOT EXISTS "tag_ids" VARCHAR(100)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(100)[];

ALTER TABLE "public"."tag"
ADD COLUMN IF NOT EXISTS "edge_ids" VARCHAR(100)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(100)[];

-- Backfill from Prisma implicit relation table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_EdgeToTag'
  ) THEN
    UPDATE "public"."edge" e
    SET "tag_ids" = (
      SELECT COALESCE(
        ARRAY(
          SELECT DISTINCT val
          FROM unnest(COALESCE(e."tag_ids", ARRAY[]::VARCHAR(100)[]) || src.tags) AS val
        ),
        ARRAY[]::VARCHAR(100)[]
      )
      FROM (
        SELECT "A" AS edge_id, COALESCE(array_agg(DISTINCT "B"), ARRAY[]::VARCHAR(100)[]) AS tags
        FROM "public"."_EdgeToTag"
        GROUP BY "A"
      ) src
      WHERE src.edge_id = e."id"
    )
    WHERE e."id" IN (SELECT "A" FROM "public"."_EdgeToTag");

    UPDATE "public"."tag" t
    SET "edge_ids" = (
      SELECT COALESCE(
        ARRAY(
          SELECT DISTINCT val
          FROM unnest(COALESCE(t."edge_ids", ARRAY[]::VARCHAR(100)[]) || src.edges) AS val
        ),
        ARRAY[]::VARCHAR(100)[]
      )
      FROM (
        SELECT "B" AS tag_id, COALESCE(array_agg(DISTINCT "A"), ARRAY[]::VARCHAR(100)[]) AS edges
        FROM "public"."_EdgeToTag"
        GROUP BY "B"
      ) src
      WHERE src.tag_id = t."id"
    )
    WHERE t."id" IN (SELECT "B" FROM "public"."_EdgeToTag");
  END IF;
END $$;

-- Backfill from legacy explicit relation table if it still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'edge_tag'
  ) THEN
    UPDATE "public"."edge" e
    SET "tag_ids" = (
      SELECT COALESCE(
        ARRAY(
          SELECT DISTINCT val
          FROM unnest(COALESCE(e."tag_ids", ARRAY[]::VARCHAR(100)[]) || src.tags) AS val
        ),
        ARRAY[]::VARCHAR(100)[]
      )
      FROM (
        SELECT "edge_id" AS edge_id, COALESCE(array_agg(DISTINCT "tag_id"), ARRAY[]::VARCHAR(100)[]) AS tags
        FROM "public"."edge_tag"
        GROUP BY "edge_id"
      ) src
      WHERE src.edge_id = e."id"
    )
    WHERE e."id" IN (SELECT "edge_id" FROM "public"."edge_tag");

    UPDATE "public"."tag" t
    SET "edge_ids" = (
      SELECT COALESCE(
        ARRAY(
          SELECT DISTINCT val
          FROM unnest(COALESCE(t."edge_ids", ARRAY[]::VARCHAR(100)[]) || src.edges) AS val
        ),
        ARRAY[]::VARCHAR(100)[]
      )
      FROM (
        SELECT "tag_id" AS tag_id, COALESCE(array_agg(DISTINCT "edge_id"), ARRAY[]::VARCHAR(100)[]) AS edges
        FROM "public"."edge_tag"
        GROUP BY "tag_id"
      ) src
      WHERE src.tag_id = t."id"
    )
    WHERE t."id" IN (SELECT "tag_id" FROM "public"."edge_tag");
  END IF;
END $$;

DROP TABLE IF EXISTS "public"."_EdgeToTag";

CREATE INDEX IF NOT EXISTS "edge_tag_ids_gin_idx" ON "public"."edge" USING GIN ("tag_ids");
CREATE INDEX IF NOT EXISTS "tag_edge_ids_gin_idx" ON "public"."tag" USING GIN ("edge_ids");
