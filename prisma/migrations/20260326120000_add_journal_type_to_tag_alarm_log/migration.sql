ALTER TABLE "public"."tag_alarm_log"
ADD COLUMN "journal_type" VARCHAR(20) NOT NULL DEFAULT 'indicator';

CREATE INDEX "tag_alarm_log_edge_id_journal_type_timestamp_idx"
ON "public"."tag_alarm_log"("edge_id", "journal_type", "timestamp");
