-- CreateTable
CREATE TABLE "public"."history" (
    "id" SERIAL NOT NULL,
    "edge" VARCHAR(100) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tag" VARCHAR(100) NOT NULL,
    "value" DECIMAL(16,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."current" (
    "id" SERIAL NOT NULL,
    "edge" VARCHAR(100) NOT NULL,
    "tag" VARCHAR(100) NOT NULL,
    "value" DECIMAL(16,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "current_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "history_edge_idx" ON "public"."history"("edge");

-- CreateIndex
CREATE INDEX "history_timestamp_idx" ON "public"."history"("timestamp");

-- CreateIndex
CREATE INDEX "history_tag_idx" ON "public"."history"("tag");

-- CreateIndex
CREATE INDEX "history_edge_tag_idx" ON "public"."history"("edge", "tag");

-- CreateIndex
CREATE INDEX "history_edge_timestamp_idx" ON "public"."history"("edge", "timestamp");

-- CreateIndex
CREATE INDEX "current_edge_idx" ON "public"."current"("edge");

-- CreateIndex
CREATE INDEX "current_tag_idx" ON "public"."current"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "current_edge_tag_key" ON "public"."current"("edge", "tag");
