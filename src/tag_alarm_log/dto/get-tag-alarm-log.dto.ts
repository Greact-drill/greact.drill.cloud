import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTagAlarmLogDto {
  @IsString()
  @IsOptional()
  edge_id?: string;

  @IsString()
  @IsOptional()
  journal_type?: 'indicator' | 'alarm';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 100;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
