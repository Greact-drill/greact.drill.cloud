-- CreateTable
CREATE TABLE "public"."alarm_widget_log" (
    "id" SERIAL NOT NULL,
    "edge_id" VARCHAR(100) NOT NULL,
    "tag_id" VARCHAR(100) NOT NULL,
    "tag_name" VARCHAR(255) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alarm_widget_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alarm_widget_log_edge_id_idx" ON "public"."alarm_widget_log"("edge_id");

-- CreateIndex
CREATE INDEX "alarm_widget_log_tag_id_idx" ON "public"."alarm_widget_log"("tag_id");

-- CreateIndex
CREATE INDEX "alarm_widget_log_timestamp_idx" ON "public"."alarm_widget_log"("timestamp");

-- CreateIndex
CREATE INDEX "alarm_widget_log_edge_id_timestamp_idx" ON "public"."alarm_widget_log"("edge_id", "timestamp");
