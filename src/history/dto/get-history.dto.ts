import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const HISTORY_AGGREGATION_MODES = ['auto', 'raw', 'bucket'] as const;
export type HistoryAggregationMode = typeof HISTORY_AGGREGATION_MODES[number];

export class GetHistoryDto {
  @IsString({ message: 'edge must be a string' })
  @IsNotEmpty({ message: 'edge is required' })
  edge: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'limit must be a number' })
  @Min(1, { message: 'limit must be greater than 0' })
  @Max(100, { message: 'limit must be less than or equal to 100' })
  limit?: number;

  @IsOptional()
  @IsDateString({}, { message: 'from must be a valid ISO 8601 date' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to must be a valid ISO 8601 date' })
  to?: string;

  @IsOptional()
  @IsString({ message: 'aggregation must be a string' })
  @IsIn(HISTORY_AGGREGATION_MODES, { message: 'aggregation must be auto, raw or bucket' })
  aggregation?: HistoryAggregationMode;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'targetPoints must be a number' })
  @Min(100, { message: 'targetPoints must be at least 100' })
  @Max(5000, { message: 'targetPoints must be less than or equal to 5000' })
  targetPoints?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'resolutionSeconds must be a number' })
  @Min(1, { message: 'resolutionSeconds must be greater than 0' })
  @Max(31536000, { message: 'resolutionSeconds is too large' })
  resolutionSeconds?: number;

  /** Comma-separated tag ids; when set, only these tags are returned (reduces payload and DB work). */
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => String(item).split(','))
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 500);
    }
    return String(value)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 500);
  })
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  tags?: string[];

  /** When true, each history point is `[unixMs, value]` instead of `{ timestamp: ISO, value }`. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === '1' || value === 'true')
  @IsBoolean()
  compact?: boolean;
}
