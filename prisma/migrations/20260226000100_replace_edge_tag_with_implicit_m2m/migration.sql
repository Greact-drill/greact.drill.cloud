-- Create implicit many-to-many relation table for Edge <-> Tag
CREATE TABLE "public"."_EdgeToTag" (
    "A" VARCHAR(100) NOT NULL,
    "B" VARCHAR(100) NOT NULL
);

-- Enforce uniqueness and query performance
CREATE UNIQUE INDEX "_EdgeToTag_AB_unique" ON "public"."_EdgeToTag"("A", "B");
CREATE INDEX "_EdgeToTag_B_index" ON "public"."_EdgeToTag"("B");

-- Foreign keys for implicit relation table
ALTER TABLE "public"."_EdgeToTag"
ADD CONSTRAINT "_EdgeToTag_A_fkey"
FOREIGN KEY ("A") REFERENCES "public"."edge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."_EdgeToTag"
ADD CONSTRAINT "_EdgeToTag_B_fkey"
FOREIGN KEY ("B") REFERENCES "public"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Move existing links from explicit relation table
INSERT INTO "public"."_EdgeToTag" ("A", "B")
SELECT "edge_id", "tag_id"
FROM "public"."edge_tag"
ON CONFLICT ("A", "B") DO NOTHING;

-- Drop old explicit relation table
DROP TABLE "public"."edge_tag";
