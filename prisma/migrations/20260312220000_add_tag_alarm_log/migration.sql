-- CreateTable
CREATE TABLE "public"."tag_alarm_log" (
    "id" SERIAL NOT NULL,
    "edge_id" VARCHAR(100) NOT NULL,
    "tag_id" VARCHAR(100) NOT NULL,
    "tag_name" VARCHAR(255) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "min_limit" DOUBLE PRECISION NOT NULL,
    "max_limit" DOUBLE PRECISION NOT NULL,
    "alarm_type" VARCHAR(20) NOT NULL,
    "unit_of_measurement" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_alarm_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tag_alarm_log_edge_id_idx" ON "public"."tag_alarm_log"("edge_id");

-- CreateIndex
CREATE INDEX "tag_alarm_log_tag_id_idx" ON "public"."tag_alarm_log"("tag_id");

-- CreateIndex
CREATE INDEX "tag_alarm_log_timestamp_idx" ON "public"."tag_alarm_log"("timestamp");

-- CreateIndex
CREATE INDEX "tag_alarm_log_edge_id_timestamp_idx" ON "public"."tag_alarm_log"("edge_id", "timestamp");
