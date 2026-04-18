import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { GetHistoryDto, type HistoryAggregationMode } from './dto/get-history.dto';
import { PrismaService } from '../prisma.service';

type HistoryPoint = {
  timestamp: Date;
  value: number;
};

type HistoryGrouped = Record<string, HistoryPoint[]>;
type HistoryBucketCandidatePoint = HistoryPoint & {
  tag: string;
  bucketId: bigint | number;
};

type CustomizationItem = {
  key: string;
  value: string;
};

type HistoryGroupedWithTag = {
  name: string;
  tag_group?: string | null;
  min?: number;
  max?: number;
  comment?: string;
  unit_of_measurement?: string;
  precision?: number | null;
  tag: string;
  history: HistoryPoint[];
  customization?: CustomizationItem[];
};

type HistoryQueryOptions = Pick<GetHistoryDto, 'limit' | 'from' | 'to' | 'aggregation' | 'targetPoints' | 'resolutionSeconds'>;
const MAX_RANGE_POINTS_PER_TAG = 1500;
const DEFAULT_TARGET_POINTS = 1200;
const BUCKET_POINT_MULTIPLIER = 4;
const RANGE_COUNT_FOR_BUCKETS = 5000;
const PRETTY_BUCKETS_IN_SECONDS = [
  1,
  5,
  10,
  30,
  60,
  300,
  900,
  1800,
  3600,
  10800,
  21600,
  43200,
  86400,
];

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async create(createHistoryDto: CreateHistoryDto) {
    return this.prisma.history.create({
      data: createHistoryDto,
    });
  }

  async findAll() {
    return this.prisma.history.findMany({
      orderBy: { timestamp: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.history.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateHistoryDto: UpdateHistoryDto) {
    return this.prisma.history.update({
      where: { id },
      data: updateHistoryDto,
    });
  }

  async remove(id: number) {
    return this.prisma.history.delete({
      where: { id },
    });
  }

  async findByEdge(edge: string) {
    return this.prisma.history.findMany({
      where: { edge },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByTag(tag: string) {
    return this.prisma.history.findMany({
      where: { tag },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findHistoryByEdge(edge: string, options: HistoryQueryOptions = {}): Promise<HistoryGrouped> {
    if (this.hasExplicitRange(options)) {
      return this.findByEdgeInRange(edge, options);
    }

    return this.findLatestByEdge(edge, options.limit ?? 20);
  }

  async findHistoryByEdgeWithTags(edge: string, options: HistoryQueryOptions = {}): Promise<HistoryGroupedWithTag[]> {
    const groupedHistory = await this.findHistoryByEdge(edge, options);
    return this.attachTagMetadata(edge, groupedHistory);
  }

  private hasExplicitRange(options: HistoryQueryOptions): boolean {
    return Boolean(options.from || options.to);
  }

  private parseDateRange(options: HistoryQueryOptions): { from?: Date; to?: Date } {
    const from = options.from ? new Date(options.from) : undefined;
    const to = options.to ? new Date(options.to) : undefined;

    if (from && Number.isNaN(from.getTime())) {
      throw new BadRequestException('Параметр from содержит некорректную дату');
    }

    if (to && Number.isNaN(to.getTime())) {
      throw new BadRequestException('Параметр to содержит некорректную дату');
    }

    if (from && to && from > to) {
      throw new BadRequestException('Параметр from не может быть больше to');
    }

    return { from, to };
  }

  private groupHistoryRows(rows: Array<{ tag: string; timestamp: Date; value: number }>): HistoryGrouped {
    return rows.reduce<HistoryGrouped>((acc, row) => {
      if (!acc[row.tag]) {
        acc[row.tag] = [];
      }

      acc[row.tag].push({
        timestamp: row.timestamp,
        value: row.value,
      });

      return acc;
    }, {});
  }

  private normalizeBucketRows(rows: HistoryBucketCandidatePoint[]): HistoryGrouped {
    const groupedHistory: HistoryGrouped = {};
    const sortedRows = [...rows].sort((left, right) => {
      const byTag = left.tag.localeCompare(right.tag);
      if (byTag !== 0) {
        return byTag;
      }

      if (left.bucketId !== right.bucketId) {
        return left.bucketId < right.bucketId ? -1 : 1;
      }

      const byTimestamp = left.timestamp.getTime() - right.timestamp.getTime();
      if (byTimestamp !== 0) {
        return byTimestamp;
      }

      return left.value - right.value;
    });

    let currentTag: string | null = null;
    let currentBucketId: bigint | number | null = null;
    let currentBucketRows: HistoryBucketCandidatePoint[] = [];

    const flushBucket = () => {
      if (!currentTag || currentBucketRows.length === 0) {
        return;
      }

      if (!groupedHistory[currentTag]) {
        groupedHistory[currentTag] = [];
      }

      let previousBucketValue: number | null = null;

      for (const row of currentBucketRows) {
        const isSameValueInSameBucket = previousBucketValue !== null && previousBucketValue === row.value;

        if (!isSameValueInSameBucket) {
          groupedHistory[currentTag].push({
            timestamp: row.timestamp,
            value: row.value,
          });
          previousBucketValue = row.value;
        }
      }
    };

    for (const row of sortedRows) {
      if (row.tag !== currentTag || row.bucketId !== currentBucketId) {
        flushBucket();
        currentTag = row.tag;
        currentBucketId = row.bucketId;
        currentBucketRows = [];
      }

      currentBucketRows.push(row);
    }

    flushBucket();

    return groupedHistory;
  }

  private getTargetPoints(options: HistoryQueryOptions): number {
    return Math.min(Math.max(options.targetPoints ?? DEFAULT_TARGET_POINTS, 100), 5000);
  }

  private resolvePrettyBucketSizeSeconds(durationMs: number, targetPoints: number): number {
    const rawSeconds = Math.max(Math.ceil(durationMs / 1000 / Math.max(targetPoints, 1)), 1);
    return PRETTY_BUCKETS_IN_SECONDS.find((value) => value >= rawSeconds) ?? PRETTY_BUCKETS_IN_SECONDS[PRETTY_BUCKETS_IN_SECONDS.length - 1];
  }

  private async getRangeStats(edge: string, from: Date, to: Date) {
    const stats = await this.prisma.history.aggregate({
      where: {
        edge,
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      _count: {
        _all: true,
      },
    });

    return {
      totalPoints: stats._count._all,
    };
  }

  private async resolveRangeReadStrategy(edge: string, options: HistoryQueryOptions) {
    const { from, to } = this.parseDateRange(options);
    const fromValue = from ?? new Date(0);
    const toValue = to ?? new Date(8640000000000000);
    const targetPoints = this.getTargetPoints(options);
    const durationMs = Math.max(toValue.getTime() - fromValue.getTime(), 1000);
    const aggregation = options.aggregation ?? 'auto';

    if (aggregation === 'raw') {
      return {
        mode: 'raw' as const,
        from: fromValue,
        to: toValue,
        targetPoints,
      };
    }

    const resolutionSeconds = options.resolutionSeconds
      ? Math.max(options.resolutionSeconds, 1)
      : this.resolvePrettyBucketSizeSeconds(durationMs, Math.max(Math.floor(targetPoints / BUCKET_POINT_MULTIPLIER), 1));

    if (aggregation === 'bucket') {
      return {
        mode: 'bucket' as const,
        from: fromValue,
        to: toValue,
        targetPoints,
        resolutionSeconds,
      };
    }

    const stats = await this.getRangeStats(edge, fromValue, toValue);
    const shouldUseBucket = stats.totalPoints > Math.max(targetPoints, RANGE_COUNT_FOR_BUCKETS);

    return {
      mode: shouldUseBucket ? 'bucket' as const : 'raw' as const,
      from: fromValue,
      to: toValue,
      targetPoints,
      resolutionSeconds,
    };
  }

  private async findByEdgeInRange(edge: string, options: HistoryQueryOptions = {}): Promise<HistoryGrouped> {
    const strategy = await this.resolveRangeReadStrategy(edge, options);

    if (strategy.mode === 'bucket') {
      return this.findByEdgeInBuckets(edge, strategy.from, strategy.to, strategy.resolutionSeconds);
    }

    type HistoryRangeResult = {
      tag: string;
      timestamp: Date;
      value: number;
    };

    const rows = await this.prisma.$queryRaw<HistoryRangeResult[]>`
      WITH ranged_records AS (
        SELECT
          tag,
          timestamp,
          value,
          ROW_NUMBER() OVER (
            PARTITION BY tag
            ORDER BY timestamp ASC
          ) AS seq,
          COUNT(*) OVER (
            PARTITION BY tag
          ) AS total
        FROM history
        WHERE edge = ${edge}
          AND timestamp >= ${strategy.from}
          AND timestamp <= ${strategy.to}
      )
      SELECT
        tag,
        timestamp,
        value
      FROM ranged_records
      WHERE total <= ${Math.max(strategy.targetPoints, MAX_RANGE_POINTS_PER_TAG)}
         OR MOD(seq - 1, GREATEST(CEIL(total::numeric / ${Math.max(strategy.targetPoints, MAX_RANGE_POINTS_PER_TAG)})::int, 1)) = 0
         OR seq = total
      ORDER BY tag ASC, timestamp ASC
    `;

    return this.groupHistoryRows(rows);
  }

  private async findByEdgeInBuckets(edge: string, from: Date, to: Date, resolutionSeconds: number): Promise<HistoryGrouped> {
    const bucketMs = Math.max(resolutionSeconds * 1000, 1000);
    const fromMs = from.getTime();

    const rows = await this.prisma.$queryRaw<HistoryBucketCandidatePoint[]>`
      WITH ranged_records AS (
        SELECT
          tag,
          timestamp,
          value,
          FLOOR((EXTRACT(EPOCH FROM timestamp) * 1000 - ${fromMs}) / ${bucketMs})::bigint AS bucket_id
        FROM history
        WHERE edge = ${edge}
          AND timestamp >= ${from}
          AND timestamp <= ${to}
      ),
      ranked_records AS (
        SELECT
          tag,
          timestamp,
          value,
          bucket_id,
          ROW_NUMBER() OVER (PARTITION BY tag, bucket_id ORDER BY timestamp ASC) AS rn_first,
          ROW_NUMBER() OVER (PARTITION BY tag, bucket_id ORDER BY timestamp DESC) AS rn_last,
          ROW_NUMBER() OVER (PARTITION BY tag, bucket_id ORDER BY value ASC, timestamp ASC) AS rn_min,
          ROW_NUMBER() OVER (PARTITION BY tag, bucket_id ORDER BY value DESC, timestamp ASC) AS rn_max
        FROM ranged_records
      ),
      picked_records AS (
        SELECT DISTINCT
          tag,
          timestamp,
          value,
          bucket_id
        FROM (
          SELECT tag, timestamp, value, bucket_id FROM ranked_records WHERE rn_first = 1
          UNION ALL
          SELECT tag, timestamp, value, bucket_id FROM ranked_records WHERE rn_min = 1
          UNION ALL
          SELECT tag, timestamp, value, bucket_id FROM ranked_records WHERE rn_max = 1
          UNION ALL
          SELECT tag, timestamp, value, bucket_id FROM ranked_records WHERE rn_last = 1
        ) AS bucket_points
      )
      SELECT
        tag,
        timestamp,
        value,
        bucket_id AS "bucketId"
      FROM picked_records
      ORDER BY tag ASC, "bucketId" ASC, timestamp ASC, value ASC
    `;

    return this.normalizeBucketRows(rows);
  }

  private async findLatestByEdge(edge: string, limit: number = 20): Promise<HistoryGrouped> {
    type HistoryResult = {
      tag: string;
      timestamp: Date;
      value: number;
    };

    const result = await this.prisma.$queryRaw<HistoryResult[]>`
      WITH latest_records AS (
        SELECT
          edge,
          tag,
          timestamp,
          value,
          ROW_NUMBER() OVER (
            PARTITION BY edge, tag
            ORDER BY timestamp DESC
          ) as rn
        FROM history
        WHERE edge = ${edge}
      )
      SELECT
        tag,
        timestamp,
        value
      FROM latest_records
      WHERE rn <= ${limit}
      ORDER BY tag, timestamp ASC
    `;

    return this.groupHistoryRows(result);
  }

  private async attachTagMetadata(edge: string, groupedHistory: HistoryGrouped): Promise<HistoryGroupedWithTag[]> {
    const tagIds = Object.keys(groupedHistory);
    if (tagIds.length === 0) {
      return [];
    }

    const [tagRecords, customizationRecords] = await Promise.all([
      this.prisma.tag.findMany({
        where: {
          id: { in: tagIds },
        },
      }),
      this.prisma.tag_customization.findMany({
        where: {
          edge_id: edge,
          tag_id: { in: tagIds },
        },
        select: {
          tag_id: true,
          key: true,
          value: true,
        },
      }),
    ]);

    const tagsMap = new Map(tagRecords.map((tag) => [tag.id, tag]));
    const customizationMap = new Map<string, CustomizationItem[]>();

    for (const record of customizationRecords) {
      if (!customizationMap.has(record.tag_id)) {
        customizationMap.set(record.tag_id, []);
      }

      customizationMap.get(record.tag_id)?.push({
        key: record.key,
        value: record.value,
      });
    }

    return tagIds
      .map((tagId) => {
        const tagInfo = tagsMap.get(tagId);

        return {
          tag: tagId,
          name: tagInfo?.name || tagId,
          tag_group: tagInfo?.tag_group ?? null,
          min: tagInfo?.min,
          max: tagInfo?.max,
          comment: tagInfo?.comment,
          unit_of_measurement: tagInfo?.unit_of_measurement,
          precision: tagInfo?.precision,
          history: groupedHistory[tagId] ?? [],
          customization: customizationMap.get(tagId) ?? [],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
