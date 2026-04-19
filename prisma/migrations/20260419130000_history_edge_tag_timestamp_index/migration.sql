-- Supports queries: WHERE edge = $1 AND tag IN (...) AND timestamp BETWEEN ...
-- (existing @@index([edge, timestamp]) helps edge+time scans; this index matches edge+tag+time filters.)
-- Time-based partitioning is a separate DBA operation (table rewrite / cutover); not applied here.

CREATE INDEX IF NOT EXISTS "history_edge_tag_timestamp_idx" ON "public"."history" ("edge", "tag", "timestamp");
